"use client";
import { ConversationsList } from "@/components/projects/ConversationsList";
import { KnowledgeBaseSidebar } from "@/components/projects/KnowledgeBaseSidebar";
import { FileDetailsModal } from "@/components/projects/FileDetailsModal";
import { use, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotFound } from "@/components/ui/NotFound";
import { toast } from "react-hot-toast";
import { Project } from "next/dist/build/swc/types";
import { Chat, ProjectDocument, ProjectSettings } from "@/lib/types";
import {useRouter} from "next/navigation";

interface ProjectData {
    project: Project | null;
    chats: Chat[];
    documents: ProjectDocument[];
    settings: ProjectSettings | null;
}


const ProjectPage = ({params}: {params: Promise<{projectId: string}>}) => {
  const router = useRouter();
  const { projectId } = use(params);
  const { getToken, userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"documents"|"settings">("documents");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [data, setData] = useState<ProjectData>({
    project: null,
    chats: [],
    documents: [],
    settings: null,
  })

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  useEffect(() => {

    const loadAllData = async () => {
        if(!userId) return
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const [projectRes, chatsRes, filesRes, settingsRes] = await Promise.all([
              apiClient.get(`/api/projects/${projectId}`,token),
              apiClient.get(`/api/projects/${projectId}/chats`, token),
              apiClient.get(`/api/projects/${projectId}/files`, token),
              apiClient.get(`/api/projects/${projectId}/settings`, token)
            ]);
            // Fetch project data here using the token
            setData({
              project: projectRes.data,
              chats: chatsRes.data,
              documents: filesRes.data,
              settings: settingsRes.data,
            });
        } catch (err) {
            setError("Failed to load project data");
        } finally {
            setLoading(false);
        }
    }

    loadAllData();
  },[userId, projectId])           
   
  useEffect(() => {
    const hasProcessingDocuments = data.documents.some(doc =>
      doc.processing_status && !["completed","failed"].includes(doc.processing_status)
    );
    if (!hasProcessingDocuments) 
        return;

    const pollInterval = setInterval(async () => {
        try{
          const token = await getToken();
          const documentsRes = await apiClient.get(`/api/projects/${projectId}/files`, token);
          setData((prev) => ({
            ...prev,
            documents: documentsRes.data
          }));

        } catch (err) {
          console.error("Error polling processing documents:", err);
        }
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(pollInterval); // Cleanup on unmount or when dependencies change
  }, [data.documents,projectId,getToken]);
  
  //   Chat-related methods
  const handleCreateNewChat = async () => {
     if(!userId) return ;
     try{
        setIsCreatingChat(true);
        const token = await getToken();
        const chatNumber = Date.now() % 1000; // Generate a chat number between 0 and 999
        const response = await apiClient.post(`/api/chats/`, {
          project_id: projectId,
          title: `New Chat ${chatNumber}`
        }, token);

        if(response.data){
          const chatId = response.data.id;
          router.push(`/projects/${projectId}/chats/${chatId}`);
          setData((prev) => ({
            ...prev,
            chats: [response.data, ...prev.chats]
          }));
          toast.success("Chat created successfully");
        }
     } catch (err) {
        toast.error("Failed to create chat");
     } finally {
        setIsCreatingChat(false);
     }
  };

  const handleDeleteChat = async (chatId: string) => {
     if(!userId) return;
     try {
        const token = await getToken();
        const response = await apiClient.delete(`/api/chats/${chatId}`, token);
        if(response.data){
          setData((prev) => ({
            ...prev,
            chats: prev.chats.filter((chat) => chat.id !== chatId)
          }));
          toast.success("Chat deleted successfully");
        }
     } catch (err) {
        toast.error("Failed to delete chat");
     }
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/projects/${projectId}/chats/${chatId}`);
  };

  //   Document-related methods
  const handleDocumentUpload = async (files: File[]) => {
      if(!userId) return;
      const token = await getToken();
      const uploadedDocuments: ProjectDocument[] = [];

      const uploadPromises = files.map(async (file) => {
        try {
  
            console.log(`file ${file}`)
            // not updaload all file at 
            // this moment. So it need to pass part of the file information.
            const uploadUrlResponse = await apiClient.post(`api/projects/${projectId}/files/upload-url`, 
            { filename: file.name, file_size: file.size, file_type: file.type }, token);
             
            const { upload_url, s3_key} = uploadUrlResponse.data;
            console.log(`uploadUrl: ${upload_url}, s3_key: ${s3_key}`)

            await apiClient.uploadToS3(upload_url, file);

            //step 3: Confirm upload to the server (update status & backend process)
            const updatedDocument = await apiClient.post(`api/projects/${projectId}/files/confirm`,
            { s3_key }, token);

            uploadedDocuments.push(updatedDocument.data);

        } catch (error: any) {
           toast.error(`Failed to upload document: ${error.message || error}`);
        }
      });
      
      await Promise.all(uploadPromises);
    
      if (uploadedDocuments.length > 0){
        setData((prev) => {
          return {
            ...prev,
            documents: [...uploadedDocuments, ...prev.documents]
          }
        })
        toast.success("Documents uploaded successfully");
      }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if(!userId) return;
    try {
      const token = await getToken();
      const response = await apiClient.delete(`/api/projects/${projectId}/files/${documentId}`, token);
      if(response.data){
        setData((prev) => ({
          ...prev,
          documents: prev.documents.filter((doc) => doc.id !== documentId)
        }));
        toast.success("Document deleted successfully");
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleUrlAdd = async (url: string) => {
    if(!userId) return;

    try {
          const token = await getToken();
          const response = await apiClient.post(`api/projects/${projectId}/urls`, { url }, token);
          const newDocument = response.data;

          setData((prev) => ({
            ...prev,
            documents: [newDocument, ...prev.documents]
          }));
          
          toast.success("Website URL added successfully");
      } catch (err) {
          toast.error("Failed to add website URL");
      }   
  };

  const handleOpenDocument = (documentId: string) => {
    console.log("Open document", documentId);
    setSelectedDocumentId(documentId);
  };

  // Project settings

  const handleDraftSettings = (updates: any) => {
    setData((prev) => {
      if(!prev.settings){
         console.warn("no previous settings found. can not update")
         return prev; // Return previous state if no settings exist
      }
      return {
        ...prev,
        settings: {...prev.settings, ...updates}
      };
    });
  };

  const handlePublishSettings = async () => {
    if(!userId || !data.settings) {
      toast.error("Cannot publish settings: missing user or settings");
      return; // Add return here to prevent further execution if conditions are not met
    }
    try {
      const token = await getToken();
      const updatedSettings = await apiClient.put(`/api/projects/${projectId}/settings`, data.settings, token);

      setData((prev) => ({
        ...prev,
        settings: updatedSettings.data
      }));  
      toast.success("Settings published successfully");

    } catch (err) {
      console.error("Failed to publish settings", err);   
      toast.error("Failed to publish settings");
    }
  };

  if(loading) return <LoadingSpinner message="Loading projects..." />;
  const { project } = data;
  if(!project) {
    return <NotFound message="Project not found" />
  }
  const selectedDocument = selectedDocumentId
    ? data.documents.find((doc) => doc.id == selectedDocumentId)
    : null;
  return (
    <>
      <div className="flex h-screen bg-[#0d1117] gap-4 p-4">
        <ConversationsList
          project={project}
          conversations={data.chats}
          error={error}
          loading={isCreatingChat}
          onCreateNewChat={handleCreateNewChat}
          onChatClick={handleChatClick}
          onDeleteChat={handleDeleteChat}
        />

        {/* KnowledgeBase Sidebar */}
        <KnowledgeBaseSidebar
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          projectDocuments={data.documents}
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          onOpenDocument={handleOpenDocument}
          onUrlAdd={handleUrlAdd}
          projectSettings={data.settings}
          settingsError={error}
          settingsLoading={loading}
          onUpdateSettings={handleDraftSettings}
          onApplySettings={handlePublishSettings}
        />
      </div>
      
      {selectedDocument && (
        <FileDetailsModal
          document={selectedDocument}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
    </>
  );
};

export default ProjectPage;