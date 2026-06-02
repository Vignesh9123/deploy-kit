"use client";
import { useState } from "react";
import axiosClient from "@/config/axiosClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProject() {
  const [name, setName] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post("/project", { name, gitUrl });
      router.push(`/projects/${res.data.data.project.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col font-sans">
      <header className="border-b border-gray-200 dark:border-gray-800 p-6 flex items-center space-x-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition">
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Create New Project</h1>
      </header>
      
      <main className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 border border-red-500 text-red-500 rounded-md text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">Project Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-project"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-transparent rounded-md focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="gitUrl" className="block text-sm font-medium">Git Repository URL</label>
            <input
              id="gitUrl"
              type="url"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-transparent rounded-md focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-md font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </main>
    </div>
  );
}
