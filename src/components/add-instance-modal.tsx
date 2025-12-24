"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface AddInstanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, ec2Id: string) => void;
}

export function AddInstanceModal({ isOpen, onClose, onAdd }: AddInstanceModalProps) {
    const [name, setName] = useState("");
    const [ec2Id, setEc2Id] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !ec2Id.trim()) {
            setError("All fields are required");
            return;
        }

        if (!ec2Id.startsWith("i-")) {
            setError("Instance ID must start with 'i-'");
            return;
        }

        onAdd(name.trim(), ec2Id.trim());
        setName("");
        setEc2Id("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg max-w-md w-full border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                        Add New Instance
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Instance Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Server"
                            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="ec2Id" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Instance ID
                        </label>
                        <input
                            id="ec2Id"
                            type="text"
                            value={ec2Id}
                            onChange={(e) => setEc2Id(e.target.value)}
                            placeholder="e.g. i-1234567890abcdef0"
                            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-mono text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Instance
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}