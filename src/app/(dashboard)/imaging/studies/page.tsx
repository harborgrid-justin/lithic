"use client";

import StudyList from "@/components/imaging/StudyList";
import { ImagingStudy } from "@/services/imaging.service";
import { useRouter } from "next/navigation";

export default function StudiesPage() {
  const router = useRouter();

  const handleSelectStudy = (study: ImagingStudy) => {
    router.push(`/imaging/studies/${study.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Imaging Studies</h1>
          <p className="text-gray-600 mt-1">
            Browse and review medical imaging studies
          </p>
        </div>
      </div>

      <StudyList onSelectStudy={handleSelectStudy} />
    </div>
  );
}
