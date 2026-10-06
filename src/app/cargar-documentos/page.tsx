import type { Metadata } from "next";
import ClientDocumentUploadPortal from "./ClientDocumentUploadPortal";

export const metadata: Metadata = {
  title: "Carga segura de documentos | CNP Peritus",
  description: "Portal seguro para enviar documentos asociados a un caso.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ClientDocumentUploadPage() {
  return <ClientDocumentUploadPortal />;
}
