"use client";
import { useParams } from "next/navigation";
import { PackageForm } from "../_components/package-form";

export default function EditarPaquetePage() {
  const { id } = useParams<{ id: string }>();
  return <PackageForm packageId={id} />;
}
