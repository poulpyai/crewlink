"use client";

import { useState } from "react";
import ExaminerSlotBrowse from "./examiner-slot-browse";
import ExaminerProfileBrowse from "./examiner-profile-browse";

export default function ExaminerBrowseTabs() {
  const [activeTab, setActiveTab] = useState<"slots" | "profiles">("slots");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Find Examiners</h1>
        <p className="text-neutral-400">Book sessions or browse examiner profiles</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab("slots")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "slots"
              ? "text-primary-500"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Available Slots
          {activeTab === "slots" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("profiles")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "profiles"
              ? "text-primary-500"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          All Examiners
          {activeTab === "profiles" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "slots" && <ExaminerSlotBrowse />}
        {activeTab === "profiles" && <ExaminerProfileBrowse />}
      </div>
    </div>
  );
}
