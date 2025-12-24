"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { controlInstance } from "@/app/actions";
import { Loader2, StopCircle, PlayCircle, RefreshCw, Server, Clock, Trash2, Globe } from "lucide-react";
import clsx from "clsx";

export type ActivityLog = {
    id: string;
    action: string;
    timestamp: string;
    status: "success" | "error" | "pending";
    message: string;
};

type InstanceState = "running" | "stopped" | "pending" | "stopping" | "unknown";

interface InstanceCardProps {
    instanceId: string;
    ec2Id: string;
    title: string;
    subtitle: string;
    onLog: (log: ActivityLog) => void;
    onUpdateLog: (id: string, status: ActivityLog["status"], message: string) => void;
    onDelete: () => void;
}

export function InstanceCard({ instanceId, ec2Id, title, subtitle, onLog, onUpdateLog, onDelete }: InstanceCardProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isLoadingRef = useRef<boolean>(false);
    const [instanceState, setInstanceState] = useState<InstanceState>("unknown");
    const [launchTime, setLaunchTime] = useState<string | null>(null);
    const [publicIp, setPublicIp] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<string>("-");

    const checkStatus = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const result = await controlInstance(title, ec2Id, 'getStatus');
            if (result.success) {
                let rawStatus = "unknown";
                let newLaunchTime: string | null = null;
                let newPublicIp: string | null = null;
                const responseData = result.data;
                
                console.log(`[${title}] Status Response:`, responseData);

                // Normalize to single item
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const item = (Array.isArray(responseData) && responseData.length > 0) ? responseData[0] : responseData as any;

                if (item) {
                    const resultVal = item.result || item.status;

                    if (Array.isArray(resultVal) && resultVal.length > 0) {
                        rawStatus = resultVal[0];
                        newLaunchTime = resultVal[1] || null;
                        if (resultVal.length > 2) newPublicIp = resultVal[2];
                    } else if (typeof resultVal === 'string') {
                        rawStatus = resultVal;
                    } else if (resultVal && typeof resultVal === 'object') {
                        rawStatus = resultVal.status || resultVal.state || "unknown";
                        if (resultVal.launchTime) newLaunchTime = resultVal.launchTime;
                        if (resultVal.publicIp) newPublicIp = resultVal.publicIp;
                    }
                }

                const normalizedStatus = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : "unknown";
                
                setInstanceState(normalizedStatus as InstanceState);
                if (normalizedStatus === 'running' || normalizedStatus === 'pending') {
                    if (newLaunchTime) setLaunchTime(newLaunchTime);
                    if (newPublicIp) setPublicIp(newPublicIp);
                } else {
                    setLaunchTime(null);
                    setPublicIp(null);
                }
                setLastRefreshed(new Date().toLocaleTimeString());
            } else {
                setInstanceState("unknown");
                setLaunchTime(null);
                setPublicIp(null);
            }
        } catch (error) {
            console.error(`Status check failed for ${instanceId}`, error);
            setInstanceState("unknown");
            setLaunchTime(null);
            setPublicIp(null);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [title, ec2Id, instanceId]);

    useEffect(() => {
        checkStatus(true);
        const interval = setInterval(() => checkStatus(true), 10000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    const executeAction = async (action: "powerOn" | "powerOff") => {
        if (isLoadingRef.current) return;
        
        isLoadingRef.current = true;
        setIsLoading(true);
        
        const actionName = action === "powerOn" ? `Start ${title}` : `Stop ${title}`;
        
        setInstanceState(action === "powerOn" ? "pending" : "stopping");
        
        const logId = Math.random().toString(36).substr(2, 9);
        onLog({
            id: logId,
            action: actionName,
            timestamp: new Date().toLocaleTimeString(),
            status: "pending",
            message: "Initiating request..."
        });

        try {
            const result = await controlInstance(title, ec2Id, action);
            
            if (result.success) {
                let responseMsg = "Command accepted";
                if (Array.isArray(result.data) && result.data[0]?.result) {
                     const resResult = result.data[0].result;
                     if (Array.isArray(resResult)) {
                         responseMsg = resResult[0];
                     } else {
                         // Check for structured response
                         if (typeof resResult === 'object') {
                             if (resResult.publicIp) setPublicIp(resResult.publicIp);
                             if (resResult.launchTime) setLaunchTime(resResult.launchTime);
                             if (resResult.state) setInstanceState(resResult.state.toLowerCase() as InstanceState);
                         }

                         responseMsg = typeof resResult === 'string' 
                            ? resResult 
                            : JSON.stringify(resResult);
                     }
                } else {
                    responseMsg = JSON.stringify(result.data);
                }

                onUpdateLog(logId, "success", `Response: ${responseMsg}`);
                
                const pollSchedule = [2000, 5000, 10000, 15000, 30000];
                pollSchedule.forEach(delay => setTimeout(() => checkStatus(true), delay));

            } else {
                onUpdateLog(logId, "error", result.error || "Unknown error");
                setInstanceState("unknown"); 
            }
        } catch {
             onUpdateLog(logId, "error", "Network error");
             setInstanceState("unknown");
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
        }
    };

    const getStateColor = (state: InstanceState) => {
        switch (state) {
            case "running": return "bg-emerald-500";
            case "stopped": return "bg-neutral-400";
            case "pending": return "bg-amber-500 animate-pulse";
            case "stopping": return "bg-rose-500 animate-pulse";
            default: return "bg-neutral-300";
        }
    };

    const getStateLabel = (state: InstanceState) => {
        switch (state) {
            case "running": return "Running";
            case "stopped": return "Stopped";
            case "pending": return "Starting...";
            case "stopping": return "Stopping...";
            default: return "Unknown";
        }
    };

    const getUptimeString = () => {
        if (!launchTime || instanceState !== 'running') return null;
        
        const start = new Date(launchTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        if (diff < 0) return "Just started";

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    const uptime = getUptimeString();

    return (
        <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {subtitle}
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <RefreshCw className={clsx("w-3 h-3", isLoading && "animate-spin")} />
                        <span className="hidden sm:inline">Updated: {lastRefreshed}</span>
                    </div>
                    <button 
                        onClick={onDelete}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove Instance"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Status Indicator */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500",
                        instanceState === "running" ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500" :
                        instanceState === "stopped" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500" :
                        "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500"
                    )}>
                        <Server className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                            {title}
                        </h3>
                        <div className="flex flex-col mt-1.5 gap-1">
                            <div className="flex items-center gap-2">
                                <span className={clsx("w-2.5 h-2.5 rounded-full", getStateColor(instanceState))} />
                                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                    {getStateLabel(instanceState)}
                                </span>
                            </div>
                            {uptime && (
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-1 duration-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Up: {uptime}</span>
                                </div>
                            )}
                            {publicIp && instanceState === 'running' && (
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in slide-in-from-top-1 duration-500">
                                    <Globe className="w-3 h-3" />
                                    <span>{publicIp}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => executeAction("powerOn")}
                        disabled={isLoading || instanceState === "running" || instanceState === "pending"}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                    >
                        {instanceState === "pending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                        Power On
                    </button>
                    <button
                        onClick={() => executeAction("powerOff")}
                        disabled={isLoading || instanceState === "stopped" || instanceState === "stopping"}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {instanceState === "stopping" ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                        Stop
                    </button>
                </div>
            </div>
        </div>
    );
}