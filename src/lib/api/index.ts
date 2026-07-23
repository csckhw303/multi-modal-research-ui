const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, ""); // Replace with your actual API base URL

const buildUrl = (endpoint: string) => `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

export const apiClient = {
   get: async (endpoint:string, token?:string | null) => {
        const headers:HeadersInit = {};
        if(token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(buildUrl(endpoint), {
            headers
        });
        if(!response.ok) {
            console.error(`${response.status} - ${response.statusText}`, response);
            throw new Error(`API request failed with status ${response.status}`);
        }

        return response.json();     
   },
   post: async (endpoint: string, data: any, token?: string| null) => {
           const headers: HeadersInit = {
             "Content-Type": "application/json"
           };
           if (token) {
              headers["Authorization"] = `Bearer ${token}`;
           }
           const response = await fetch(buildUrl(endpoint), {
               method: "POST",
               headers,
               body: JSON.stringify(data)
           });
           if(!response.ok) {
               console.error(`${response.status} - ${response.statusText}`, response);
               throw new Error(`API request failed with status ${response.status}`);
           }
           return response.json();     
   },
   delete: async (endpoint:string, token?: string| null) => {
        const headers: HeadersInit ={}
        if (token){
            headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(buildUrl(endpoint), {
            method: "DELETE",
            headers
        });
        if(!response.ok)
        {
            console.error(`${response.status} - ${response.statusText}`, response);
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
   }
}