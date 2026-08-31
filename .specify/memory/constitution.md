<!--
Sync Impact Report
- Version change: (template, sem versão) → 1.0.0
- Modified principles: todos os placeholders do template substituídos por conteúdo concreto
  - [PRINCIPLE_1_NAME] → I. Experiência Intuitiva em Primeiro Lugar
  - [PRINCIPLE_2_NAME] → II. Firebase como Backend Único
  - [PRINCIPLE_3_NAME] → III. Multi-Dispositivo por Padrão
  - [PRINCIPLE_4_NAME] → IV. Integridade dos Dados Financeiros
  - [PRINCIPLE_5_NAME] → V. Simplicidade e Entrega Incremental
- Added sections: Restrições Tecnológicas; Fluxo de Desenvolvimento
- Removed sections: nenhuma (estrutura do template preservada)
- Follow-up TODOs: nenhum
-->

# Planner Constitution

Constituição do **Planner** — aplicativo pessoal de organização de rotina com
gerenciador financeiro (gastos e ganhos mensais), acessível no PC e no celular.

## Core Principles

### I. Experiência Intuitiva em Primeiro Lugar

Toda interface DEVE ser desenhada antes de ser implementada, seguindo a skill
`frontend-design` como guia de direção visual. A UI DEVE ser bonita, coesa e
compreensível sem tutorial: um usuário leigo DEVE conseguir registrar um gasto
ou um item de rotina em no máximo 3 interações a partir da tela inicial.
Componentes visuais DEVEM seguir um sistema de design único (tipografia,
cores, espaçamento) definido no início do projeto — nada de estilos ad hoc por
tela.

**Racional**: o objetivo do app é organizar a vida do usuário; uma interface
confusa destruiria exatamente o valor que o app promete entregar.

### II. Firebase como Backend Único

O Firebase é a única infraestrutura de backend do projeto: **Cloud Firestore**
para persistência de dados e **Firebase Authentication** para identidade.
NÃO DEVE ser introduzido outro banco de dados, outro provedor de autenticação
ou servidor próprio sem emenda a esta constituição. Todo dado do usuário DEVE
ser gravado no Firestore sob o UID do usuário autenticado, e as **Security
Rules** DEVEM garantir que cada usuário só leia e escreva os próprios dados.

**Racional**: um único backend gerenciado elimina servidores para manter,
dá sincronização em tempo real de graça e mantém o projeto simples.

### III. Multi-Dispositivo por Padrão

O app DEVE funcionar igualmente bem no PC e no celular. Todo layout DEVE ser
responsivo (mobile-first, adaptando-se a telas grandes) e toda mutação de
dados DEVE sincronizar entre dispositivos via Firestore em tempo real — sem
botão de "sincronizar" manual. Uma feature só é considerada pronta depois de
verificada em viewport mobile (~375px) e desktop (~1280px).

**Racional**: o usuário alterna entre PC e celular no dia a dia; qualquer
divergência de dados ou layout quebrado em um dos dispositivos torna o app
inconfiável.

### IV. Integridade dos Dados Financeiros

Valores monetários DEVEM ser armazenados como inteiros em centavos (nunca
ponto flutuante) e toda transação DEVE registrar: valor, tipo (ganho/gasto),
categoria e data. Operações que derivam totais (saldo do mês, gasto por
categoria) DEVEM ser calculadas a partir das transações registradas, nunca
armazenadas como única fonte de verdade. Exclusões de transações DEVEM pedir
confirmação ao usuário. Lógica de cálculo financeiro DEVE ter testes
automatizados antes do merge.

**Racional**: o app existe para o usuário confiar nos próprios números; um
centavo errado por arredondamento ou um total dessincronizado quebra essa
confiança.

### V. Simplicidade e Entrega Incremental

Começar simples (YAGNI): cada feature DEVE ser entregue como uma fatia
vertical utilizável (UI + dados + regras) antes de iniciar a próxima.
NÃO DEVEM ser adicionadas abstrações, bibliotecas ou camadas sem necessidade
demonstrada no momento. Complexidade adicional DEVE ser justificada por
escrito no plano da feature que a introduz.

**Racional**: projeto pessoal com um desenvolvedor; excesso de arquitetura
atrasa a entrega do valor real (organizar rotina e finanças).

## Restrições Tecnológicas

- **Backend**: Firebase — Cloud Firestore (dados) e Firebase Authentication
  (login com Google e e-mail/senha).
- **Frontend**: aplicação web responsiva (SPA/PWA), servindo PC e celular com
  uma única base de código.
- **Design**: direção visual conduzida pela skill `frontend-design`; sistema
  de design documentado e reutilizado em todas as telas.
- **Idioma da interface**: português (pt-BR), incluindo formatação de moeda
  (R$) e datas.
- **Segredos**: chaves e configuração do Firebase ficam em variáveis de
  ambiente/configuração local; nada de credenciais sensíveis commitadas.

## Fluxo de Desenvolvimento

- Toda feature nasce de uma especificação (`/speckit-specify`) e de um plano
  (`/speckit-plan`) antes do código.
- Cada tarefa concluída DEVE resultar em commit atômico com mensagem clara.
- Antes de considerar uma feature pronta: verificação visual em mobile e
  desktop (Princípio III), regras de segurança do Firestore cobrindo os novos
  dados (Princípio II) e testes dos cálculos financeiros envolvidos
  (Princípio IV).
- Dúvidas de produto (ex.: categorias padrão, moeda, recorrência de gastos)
  DEVEM ser perguntadas ao usuário em vez de assumidas silenciosamente.

## Governance

Esta constituição prevalece sobre qualquer outra prática do projeto. Emendas
exigem: descrição da mudança, justificativa e atualização da versão conforme
versionamento semântico — MAJOR para remoção/redefinição incompatível de
princípios, MINOR para novo princípio ou expansão material, PATCH para
esclarecimentos e ajustes de redação. Todo plano e revisão de código DEVE
verificar conformidade com os princípios acima; desvios DEVEM ser
justificados por escrito ou corrigidos antes do merge.

**Version**: 1.0.0 | **Ratified**: 2026-08-29 | **Last Amended**: 2026-08-29
