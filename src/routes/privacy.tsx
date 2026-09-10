import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Biofy" },
      {
        name: "description",
        content: "Política de Privacidade da plataforma Biofy.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    title: "Quem trata os dados",
    paragraphs: [
      "A Biofy é responsável pelo tratamento de dados pessoais realizado no contexto de sua plataforma, atualmente disponível em https://bio-fy.vercel.app. Para assuntos de privacidade, o contato é ndolir16@gmail.com.",
      "Esta Política é aplicada aos usuários da Biofy no Brasil e deve ser interpretada conforme a Lei Geral de Proteção de Dados Pessoais (LGPD) e demais normas aplicáveis.",
    ],
  },
  {
    title: "Dados que podemos coletar",
    items: [
      "Dados de cadastro, como nome, e-mail, foto de perfil, username e informações necessárias à autenticação.",
      "Conteúdo fornecido pelo usuário, como biografia, textos, links, imagens, preferências, configurações e informações publicadas em suas páginas.",
      "Dados técnicos e de uso, como navegador, informações do dispositivo, registros técnicos, funcionalidades acessadas, interações com a plataforma e cookies necessários ao funcionamento do serviço.",
      "Dados relacionados à assinatura, quando a cobrança for habilitada, como plano, status de pagamento, renovação, cancelamento e identificadores de transação recebidos do intermediador de pagamentos.",
      "Textos e instruções enviados voluntariamente a recursos de inteligência artificial quando essas funcionalidades estiverem disponíveis.",
    ],
  },
  {
    title: "Login com Google",
    paragraphs: [
      "Quando o usuário optar por entrar com sua Conta Google, a Biofy poderá receber os dados autorizados necessários à autenticação, como nome, endereço de e-mail, foto de perfil e identificador da conta.",
      "O login padrão não implica acesso geral ao Gmail, Google Drive, contatos, calendário ou outros serviços da Conta Google.",
    ],
  },
  {
    title: "Finalidades do tratamento",
    items: [
      "Criar, autenticar e proteger contas e sessões.",
      "Criar, salvar, publicar e gerenciar páginas de bio e seus conteúdos.",
      "Aplicar limites e funcionalidades de acordo com o plano contratado.",
      "Disponibilizar recursos internos de analytics e informações de uso da página.",
      "Processar, verificar e gerenciar assinaturas quando os planos pagos forem habilitados.",
      "Executar funcionalidades de inteligência artificial solicitadas pelo próprio usuário.",
      "Prevenir fraude, abuso e incidentes de segurança, diagnosticar erros e manter a plataforma operacional.",
      "Cumprir obrigações legais e responder a solicitações relativas à privacidade e aos direitos dos titulares.",
    ],
  },
  {
    title: "Bases legais",
    paragraphs: [
      "A Biofy poderá tratar dados com fundamento nas bases legais previstas na LGPD, conforme a finalidade correspondente, incluindo execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse quando juridicamente cabível e consentimento do titular quando exigido.",
    ],
  },
  {
    title: "Conteúdo público",
    paragraphs: [
      "Nome público, foto, username, biografia, links, textos, imagens e outros elementos que o usuário decidir publicar poderão ficar acessíveis a qualquer pessoa que visite a respectiva página pública.",
      "Dados privados de autenticação e informações internas da conta não se tornam públicos apenas porque uma página foi publicada.",
    ],
  },
  {
    title: "Cookies e dados de uso",
    paragraphs: [
      "A Biofy poderá utilizar cookies ou tecnologias equivalentes necessários para autenticação, manutenção da sessão, segurança, preferências, funcionamento técnico e prevenção de abuso.",
      "A Biofy não utiliza atualmente e-mails de marketing nem declara utilizar Google Analytics, Meta Pixel ou ferramentas externas equivalentes para publicidade comportamental. Caso isso seja alterado, esta Política será atualizada e os mecanismos de escolha exigidos por lei serão implementados.",
    ],
  },
  {
    title: "Inteligência artificial",
    paragraphs: [
      "A Biofy poderá integrar futuramente provedores de inteligência artificial para auxiliar usuários na criação e personalização de suas páginas. Quando a funcionalidade for usada, os textos e instruções enviados pelo usuário poderão ser processados pelo provedor necessário à geração da resposta.",
      "A ferramenta de IA ainda poderá estar indisponível enquanto estiver em desenvolvimento. A Biofy deverá informar de forma adequada quando uma funcionalidade utilizar inteligência artificial.",
    ],
  },
  {
    title: "Treinamento e melhoria de IA",
    paragraphs: [
      "A Biofy poderá futuramente utilizar determinados dados ou conteúdos para melhoria ou treinamento de sistemas de inteligência artificial. Quando a legislação exigir consentimento, esse tratamento somente será realizado após manifestação específica, livre, informada e destacada do usuário.",
      "A criação de conta ou a simples aceitação dos Termos de Uso não será tratada como autorização automática para treinamento de IA quando for necessário consentimento específico. A recusa não impedirá o uso das funcionalidades essenciais que não dependam desse tratamento.",
      "Dados pessoais de usuários menores de 18 anos não serão utilizados pela Biofy para treinamento de modelos de inteligência artificial.",
    ],
  },
  {
    title: "Fornecedores e compartilhamento",
    paragraphs: [
      "Para operar a plataforma, a Biofy utiliza ou poderá utilizar serviços de terceiros, incluindo Supabase para autenticação, banco de dados, armazenamento e backend; Vercel para hospedagem e disponibilização da aplicação; Google para autenticação; Asaas para processamento e gerenciamento futuro de pagamentos e assinaturas; e provedores de inteligência artificial quando esses recursos forem habilitados.",
      "O compartilhamento ou acesso por fornecedores será limitado ao necessário para prestar a funcionalidade correspondente, cumprir obrigações legais ou proteger a plataforma e seus usuários.",
    ],
  },
  {
    title: "Pagamentos",
    paragraphs: [
      "Quando os planos pagos forem habilitados, a Biofy pretende utilizar o Asaas como intermediador de pagamentos. A Biofy poderá receber informações sobre o status da cobrança, plano, renovação, cancelamento e identificadores necessários para liberar ou encerrar benefícios.",
      "Dados financeiros sensíveis, como informações completas de cartão, poderão ser processados diretamente pelo intermediador de pagamentos e não deverão ser armazenados pela Biofy quando não forem necessários à prestação do serviço.",
    ],
  },
  {
    title: "Transferências internacionais",
    paragraphs: [
      "Alguns fornecedores tecnológicos poderão manter infraestrutura ou realizar operações de tratamento fora do Brasil. Quando houver transferência internacional de dados pessoais, a Biofy buscará utilizar mecanismos e fornecedores compatíveis com a legislação brasileira aplicável.",
    ],
  },
  {
    title: "Segurança",
    paragraphs: [
      "A Biofy buscará adotar medidas técnicas e administrativas razoáveis para proteger dados pessoais contra acesso não autorizado, perda, alteração, destruição, divulgação indevida ou tratamento ilícito. Nenhum serviço conectado à internet pode garantir segurança absoluta.",
    ],
  },
  {
    title: "Retenção e exclusão",
    paragraphs: [
      "Os dados serão mantidos pelo período necessário para prestar o serviço, manter a conta, preservar segurança, cumprir obrigações contratuais e legais e permitir o exercício regular de direitos.",
      "Após o usuário iniciar a exclusão de sua própria conta, a Biofy buscará concluir em até 7 dias a exclusão ou anonimização das informações que não precisem mais ser conservadas. Alguns registros poderão permanecer por período superior quando houver obrigação legal, prevenção de fraude, segurança ou outra base legal aplicável.",
    ],
  },
  {
    title: "Direitos do titular",
    paragraphs: [
      "Nos termos da LGPD, o titular poderá exercer, conforme aplicável, direitos como confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio ou eliminação, informação sobre compartilhamentos, portabilidade nos casos cabíveis, revogação de consentimento e oposição a tratamentos realizados em desconformidade com a lei.",
      "Solicitações podem ser encaminhadas para ndolir16@gmail.com ou realizadas diretamente pelas ferramentas disponibilizadas dentro da conta, quando disponíveis.",
    ],
  },
  {
    title: "Usuários menores de idade",
    paragraphs: [
      "A Biofy estabelece idade mínima de 13 anos para criação de conta. Usuários menores de 18 anos receberão tratamento compatível com a proteção especial prevista na legislação brasileira aplicável.",
      "A Biofy não utilizará dados pessoais de usuários menores de 18 anos para treinamento de seus modelos de inteligência artificial.",
    ],
  },
  {
    title: "Comunicações",
    paragraphs: [
      "A Biofy não utiliza atualmente os dados dos usuários para campanhas de e-mail marketing. Poderão ser enviadas mensagens necessárias à autenticação, segurança, recuperação de conta, mudanças relevantes no serviço, assinatura ou outras comunicações essenciais à relação com o usuário.",
    ],
  },
  {
    title: "Alterações e contato",
    paragraphs: [
      "Esta Política poderá ser atualizada para refletir mudanças na plataforma, na legislação, nos fornecedores ou nas formas de tratamento. Quando uma alteração exigir nova manifestação ou consentimento, a Biofy adotará as medidas correspondentes.",
      "Dúvidas e solicitações de privacidade podem ser encaminhadas para ndolir16@gmail.com.",
    ],
  },
];

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      description="Esta Política explica como a Biofy coleta, utiliza, armazena, compartilha e protege dados pessoais durante o uso da plataforma."
      updatedAt="9 de setembro de 2026"
      sections={sections}
    />
  );
}
