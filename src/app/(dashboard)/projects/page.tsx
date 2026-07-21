'use client'
import {useEffect, useState} from "react"
import {useAuth} from "@clerk/nextjs"
import {useRouter} from "next/navigation"
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";  
import {LoadingSpinner} from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { get } from "https";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null); // This line is fine as it is, no change needed
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // Model state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { getToken, userId } = useAuth()
  const router = useRouter()
  const loadProjects = async () => {
     try{

        setLoading(true);
        setError(null);
        const token = await getToken();
        const result = await apiClient.get("api/projects", token)
        const {data} = result || {}

        console.log(data, "project list")
        
        setProjects(data);

     } catch (error: any) {
        setError(error);
        toast.error("Failed to load projects");
     } finally {
        setLoading(false);
     }


  }
  const handleCreateProject = async (name: string, description: string) => {

      try{
        setError(null);
        setIsCreating(true);
        const token = await getToken();
        const result = await apiClient.post("api/projects", { name, description }, token);
        const savedProject = result?.data || {}
        setProjects((prevProjects) => [savedProject, ...prevProjects]);
        setShowCreateModal(false);
        toast.success("Project created successfully");

      } catch (error: any) {
        setError(error);
        toast.error("Failed to create project");
        console.error("Failed to create project:", error);
      } finally{
        setIsCreating(false);
      }

  }
  const handleDeleteProject = async (projectId: string) => {
     try{
             setError(null);
             const token = await getToken();
             await apiClient.delete(`api/projects/${projectId}`, token);
             setProjects((prevProjects) => prevProjects.filter(project => project.id !== projectId));
             toast.success("Project deleted successfully");

     } catch (error: any) {
        setError(error);
        toast.error("Failed to delete project");
        console.error("Failed to delete project:", error);
     }
  }
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }
  const handleOpenModal = () => {
    setShowCreateModal(true);
  }
  const handleCloseModal = () => {
    setShowCreateModal(false);
  }
  useEffect(( )=> {
    if (userId) {
     loadProjects();
    }
  },[userId])
  return (
    <div >
     <ProjectsGrid
       projects={projects}
       loading={loading}
       error={error ? error.message : null}
       searchQuery={searchQuery}
       onSearchChange={setSearchQuery}
       viewMode={viewMode}
       onViewModeChange={setViewMode}
       onProjectClick={handleProjectClick}
       onCreateProject={handleOpenModal}
       onDeleteProject={handleDeleteProject}
     />
     <CreateProjectModal
       isOpen={showCreateModal}
       onCreateProject={handleCreateProject}
       onClose={handleCloseModal}
       isLoading={isCreating}

     />
    </div>
  );
  };

export default ProjectsPage;