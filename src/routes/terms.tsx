import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | Biofy" },
      {
        name: "description",
        content: "Termos de Uso da plataforma Biofy.",
      },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    title: "Sobre a Biofy",
    paragraphs: [
      "A Biofy é uma plataforma digital para criação, personalização, publicação e gerenciamento de páginas de bio, permitindo ao usuário reunir informações, links, conteúdos e elementos visuais em páginas públicas próprias.",
      "A plataforma é atualmente destinada ao público brasileiro e está disponível em https://bio-fy.vercel.app. O canal oficial de contato é ndolir16@gmail.com.",
    ],
  },
  {
    title: "Elegibilidade e idade mínima",
    paragraphs: [
      "A criação de conta é permitida a partir de 13 anos. Usuários menores de 18 anos devem utilizar a plataforma de acordo com a legislação brasileira aplicável e, quando necessário, com participação ou autorização de seu responsável legal.",
      "Funcionalidades que exijam consentimento específico ou capacidade civil plena poderão ser limitadas a maiores de 18 anos.",
    ],
  },
  {
    title: "Conta e segurança",
    paragraphs: [
      "O usuário poderá se autenticar por e-mail e senha ou por uma conta Google. É responsável pela veracidade das informações fornecidas, pelo uso de sua conta e pela proteção de suas credenciais.",
      "A Biofy poderá adotar medidas adicionais de segurança e restringir acessos quando houver indícios de fraude, abuso, comprometimento de conta ou risco à plataforma.",
    ],
  },
  {
    title: "Planos e limites de páginas",
    paragraphs: [
      "A Biofy poderá oferecer um plano Free e planos pagos recorrentes. O plano Free permite até 1 página. O plano Pro, atualmente anunciado por R$ 21,90 por mês, permite até 3 páginas. O plano Master, atualmente anunciado por R$ 41,90 por mês, permite até 5 páginas.",
      "Os recursos, limites e preços poderão ser atualizados para novas contratações mediante informação clara ao usuário, respeitados direitos já adquiridos e a legislação aplicável.",
    ],
  },
  {
    title: "Pagamentos, recorrência e Asaas",
    paragraphs: [
      "Quando a cobrança dos planos pagos for habilitada, a Biofy pretende utilizar o Asaas como intermediador de pagamentos e assinaturas recorrentes. Enquanto a integração não estiver ativa, a plataforma não deverá simular cobranças, renovações ou upgrades pagos.",
      "Uma vez habilitada a assinatura, o usuário será informado antes da contratação sobre preço, periodicidade e renovação. O cancelamento impedirá novas renovações e, salvo hipótese legal diversa, o acesso pago poderá permanecer ativo até o término do período já quitado.",
      "Reembolsos e o direito de arrependimento serão tratados conforme a legislação brasileira aplicável e as regras obrigatórias de proteção ao consumidor.",
    ],
  },
  {
    title: "Conteúdo do usuário",
    paragraphs: [
      "O usuário é responsável pelos textos, imagens, links, nomes, descrições e demais conteúdos que publicar na Biofy, bem como por possuir os direitos e autorizações necessários para utilizá-los.",
    ],
    items: [
      "É proibido conteúdo ilegal, fraudulento, enganoso ou destinado a golpes, phishing ou distribuição de malware.",
      "É proibida a violação de direitos autorais, marcas, imagem, privacidade ou demais direitos de terceiros.",
      "É proibida a falsificação de identidade, incentivo a crimes ou utilização da plataforma para atividades vedadas pela legislação brasileira.",
    ],
  },
  {
    title: "Moderação, suspensão e remoção",
    paragraphs: [
      "A Biofy poderá remover ou restringir conteúdo, bloquear links, suspender funcionalidades ou encerrar contas quando houver violação destes Termos, risco à segurança, denúncia fundamentada, fraude, abuso ou obrigação legal.",
      "A plataforma também poderá preservar ou fornecer informações quando isso for exigido por decisão judicial, autoridade competente ou obrigação legal.",
    ],
  },
  {
    title: "Inteligência artificial",
    paragraphs: [
      "A Biofy poderá disponibilizar futuramente, especialmente no plano Master, ferramentas de inteligência artificial para auxiliar na criação, organização, redação e personalização de páginas. Esse recurso ainda poderá estar indisponível durante o desenvolvimento da plataforma.",
      "Quando utilizado, o usuário poderá fornecer instruções e textos à ferramenta. Resultados gerados por IA podem conter erros ou imprecisões e devem ser revisados antes da publicação. O usuário permanece responsável pelo conteúdo que decidir publicar.",
    ],
  },
  {
    title: "Treinamento e melhoria de IA",
    paragraphs: [
      "A aceitação destes Termos, por si só, não será considerada autorização automática para uso de dados pessoais em treinamento de inteligência artificial quando a legislação exigir consentimento específico.",
      "Quando aplicável, a Biofy apresentará escolha destacada e informada para esse tratamento. Dados pessoais de usuários menores de 18 anos não serão utilizados pela Biofy para treinamento de modelos de inteligência artificial.",
    ],
  },
  {
    title: "Serviços de terceiros",
    paragraphs: [
      "A Biofy utiliza ou poderá utilizar fornecedores necessários à operação do serviço, incluindo Supabase, Vercel, Google para autenticação, Asaas para pagamentos e provedores de inteligência artificial. Esses serviços poderão processar informações na medida necessária à execução das funcionalidades contratadas ou solicitadas.",
    ],
  },
  {
    title: "Disponibilidade e limitações",
    paragraphs: [
      "A Biofy buscará manter a plataforma funcional e disponível, mas não garante operação ininterrupta. Poderão ocorrer indisponibilidades por manutenção, atualizações, falhas técnicas, segurança, fornecedores externos ou eventos fora de seu controle razoável.",
      "A Biofy não garante resultados comerciais, financeiros, crescimento de audiência, vendas, número de acessos ou qualquer resultado específico decorrente do uso da plataforma.",
    ],
  },
  {
    title: "Propriedade intelectual",
    paragraphs: [
      "A marca Biofy, seu software, interface, identidade visual e materiais próprios são protegidos pela legislação aplicável. O conteúdo fornecido pelo usuário permanece pertencente ao usuário ou aos respectivos titulares.",
      "O usuário concede à Biofy apenas as permissões necessárias para armazenar, processar, publicar e exibir o conteúdo enquanto isso for necessário à prestação do serviço.",
    ],
  },
  {
    title: "Exclusão da conta",
    paragraphs: [
      "O usuário poderá iniciar a exclusão de sua própria conta pelos recursos disponibilizados na plataforma. A Biofy buscará concluir a remoção ou anonimização dos dados que não precisem ser mantidos em até 7 dias.",
      "Determinadas informações poderão ser conservadas por prazo superior quando necessário para cumprimento de obrigação legal ou regulatória, prevenção de fraude, segurança ou exercício regular de direitos.",
    ],
  },
  {
    title: "Alterações destes Termos",
    paragraphs: [
      "Estes Termos poderão ser atualizados para refletir alterações legais, técnicas ou operacionais. Mudanças relevantes que afetem direitos dos usuários poderão ser comunicadas por meio adequado dentro da plataforma ou por comunicação relacionada ao serviço.",
    ],
  },
  {
    title: "Legislação aplicável e contato",
    paragraphs: [
      "Estes Termos são regidos pelas leis da República Federativa do Brasil. Nenhuma disposição busca afastar direitos obrigatórios assegurados pela legislação de proteção ao consumidor ou de proteção de dados.",
      "Dúvidas ou solicitações podem ser encaminhadas para ndolir16@gmail.com.",
    ],
  },
];

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Termos de Uso"
      description="Estes Termos regulam o acesso e a utilização da Biofy e integram a relação entre a plataforma e seus usuários. Ao criar uma conta ou continuar utilizando o serviço, o usuário declara ter lido e compreendido estas condições e a Política de Privacidade."
      updatedAt="9 de setembro de 2026"
      sections={sections}
    />
  );
}
