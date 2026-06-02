"use client";
import { useEffect, useState } from "react";
import axiosClient from "@/config/axiosClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Deployment {
  id: string;
  status: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  repo_id: string;
  user_id: string;
}

export default function ProjectDetails() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deployName, setDeployName] = useState("");
  const [deployPort, setDeployPort] = useState<number | "">("");
  const [creatingDeployment, setCreatingDeployment] = useState(false);
  const [deploymentError, setDeploymentError] = useState("");

  useEffect(() => {
    if (id) {
      fetchProjectData();
      
      const interval = setInterval(() => {
        fetchDeploymentsOnly();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchDeploymentsOnly = async () => {
    try {
      const res = await axiosClient.get(`/project/${id}/deployments`);
      setDeployments(res.data.data.deployments);
    } catch (err) {
      console.error("Failed to poll deployments", err);
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, deploymentsRes] = await Promise.all([
        axiosClient.get(`/project/${id}`),
        axiosClient.get(`/project/${id}/deployments`),
      ]);
      setProject(projectRes.data.data.project);
      setDeployments(deploymentsRes.data.data.deployments);
    } catch (err: any) {
      setError("Failed to load project details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployName || !deployPort) return;
    setCreatingDeployment(true);
    setDeploymentError("");
    try {
      await axiosClient.post("/deployment", {
        name: deployName,
        projectId: id,
        port: Number(deployPort),
      });
      setDeployName("");
      setDeployPort("");
      fetchProjectData();
    } catch (err: any) {
      setDeploymentError(err.response?.data?.message || "Failed to create deployment");
    } finally {
      setCreatingDeployment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await axiosClient.delete(`/project/${id}`);
      router.push("/");
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center font-sans">
        <p className="animate-pulse">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white p-6 font-sans">
        <div className="text-red-500">{error || "Project not found"}</div>
        <Link href="/" className="underline mt-4 inline-block">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col font-sans">
      <header className="border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-md hover:bg-red-500 hover:text-white transition"
        >
          Delete Project
        </button>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full mt-8 space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight border-b border-gray-200 dark:border-gray-800 pb-2">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Project ID</p>
              <p className="font-mono text-sm mt-1">{project.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Repository ID</p>
              <p className="font-mono text-sm mt-1">{project.repo_id}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-2xl font-semibold tracking-tight">Deployments</h2>
          </div>

          <form onSubmit={handleCreateDeployment} className="border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-4">
            <h3 className="font-medium">Create New Deployment</h3>
            {deploymentError && <p className="text-red-500 text-sm">{deploymentError}</p>}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Deployment Name"
                value={deployName}
                onChange={(e) => setDeployName(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-transparent rounded-md focus:outline-none focus:border-black dark:focus:border-white transition text-sm"
              />
              <input
                type="number"
                placeholder="Port"
                value={deployPort}
                onChange={(e) => setDeployPort(e.target.value ? Number(e.target.value) : "")}
                required
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-transparent rounded-md focus:outline-none focus:border-black dark:focus:border-white transition text-sm"
              />
              <button
                type="submit"
                disabled={creatingDeployment}
                className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium transition hover:opacity-90 disabled:opacity-50 text-sm"
              >
                {creatingDeployment ? "Deploying..." : "Deploy"}
              </button>
            </div>
          </form>

          {deployments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No deployments yet.</p>
          ) : (
            <div className="space-y-4">
              {deployments.map((dep) => (
                <div key={dep.id} className="border border-gray-200 dark:border-gray-800 rounded-md p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono text-sm">{dep.id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(dep.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    dep.status === 'SUCCESS' ? 'border-green-500 text-green-500' :
                    dep.status === 'FAILED' ? 'border-red-500 text-red-500' :
                    'border-gray-500 text-gray-500'
                  }`}>
                    {dep.status || 'UNKNOWN'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
