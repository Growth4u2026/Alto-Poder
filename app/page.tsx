import { redirect } from "next/navigation";

// Tarefa 0.3 vai checar se a pessoa já está logada e mandar para /inicio.
export default function Home() {
  redirect("/entrar");
}
