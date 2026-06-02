"use client";
import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/config/firebase";
import axiosClient from "@/config/axiosClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  repo_id: string;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchProjects();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axiosClient.get("/project");
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error("Error fetching projects", error);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const creds = await signInWithPopup(auth, provider);
      const user = creds.user;
      const idToken = await user.getIdToken();
      const response = await axiosClient.post("/auth/login", { idToken });
      const newToken = response.data.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      fetchProjects();
    } catch (error) {
      console.error("Sign in failed", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setProjects([]);
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white dark:bg-black dark:text-white flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">DeployKit</h1>
        {token && (
          <button onClick={logout} className="text-sm font-medium hover:underline">
            Logout
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
        {!token ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <h2 className="text-4xl font-bold tracking-tighter">Welcome to DeployKit</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
              Deploy your projects effortlessly. Sign in to get started.
            </p>
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-md font-medium transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
          </div>
        ) : (
          <div className="space-y-8 mt-8 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Your Projects</h2>
              <Link
                href="/projects/new"
                className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium transition hover:opacity-90"
              >
                + New Project
              </Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No projects found. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block group border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-black dark:hover:border-white transition"
                  >
                    <h3 className="font-semibold text-lg group-hover:underline">{project.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate">
                      {project.id}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
