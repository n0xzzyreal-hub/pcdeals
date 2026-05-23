# PCDeals — Tutorial completo de hospedagem no GitHub Pages

## O que você vai ter no final
- Site público 24/7 hospedado em `https://seu-usuario.github.io/pcdeals/`
- Banco de dados Firebase (gratuito) para salvar e editar promoções
- Painel admin protegido por senha em `/admin`

---

## PARTE 1 — Configurar o Firebase (banco de dados + login)

### 1.1 Criar o projeto Firebase
1. Acesse **https://console.firebase.google.com**
2. Clique em **"Adicionar projeto"**
3. Dê o nome **PCDeals** e clique em Continuar
4. Pode desativar o Google Analytics → **Criar projeto**

### 1.2 Ativar o Firestore
1. No menu lateral esquerdo, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Começar no modo de produção** → Avançar
4. Escolha o local mais próximo (`southamerica-east1` = São Paulo) → **Ativar**

### 1.3 Configurar as regras do Firestore
1. Em Firestore, clique na aba **Regras**
2. Substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Qualquer pessoa pode LER promoções
    match /deals/{dealId} {
      allow read: if true;
      allow write: if request.auth != null;  // só admin autenticado escreve
    }
  }
}
```

3. Clique em **Publicar**

### 1.4 Criar conta de admin
1. No menu lateral, clique em **Authentication**
2. Clique em **Começar** → aba **Sign-in method**
3. Clique em **E-mail/senha** → Ativar → Salvar
4. Vá para a aba **Usuários** → **Adicionar usuário**
5. Coloque seu e-mail e uma senha forte → **Adicionar usuário**

> Guarde esse e-mail e senha — são as credenciais do `/admin`

### 1.5 Pegar as credenciais do seu projeto
1. No painel Firebase, clique na engrenagem ⚙️ → **Configurações do projeto**
2. Role para baixo até **"Seus aplicativos"**
3. Clique em **</>** (Web)
4. Dê o apelido **pcdeals-web** → clique em **Registrar app**
5. Você verá um bloco `firebaseConfig` assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "pcdeals-xxxxx.firebaseapp.com",
  projectId: "pcdeals-xxxxx",
  storageBucket: "pcdeals-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. **Copie esses valores** e cole no arquivo `js/firebase-config.js` substituindo os `"COLE_AQUI"`

---

## PARTE 2 — Publicar no GitHub Pages

### 2.1 Criar o repositório
1. Acesse **https://github.com** e faça login (crie uma conta se não tiver)
2. Clique em **"New repository"** (botão verde no canto superior direito)
3. Nome do repositório: `pcdeals`
4. Deixe como **Public**
5. Clique em **Create repository**

### 2.2 Instalar Git no seu computador
- **Windows**: baixe em https://git-scm.com/download/win e instale
- **macOS**: já vem instalado (ou instale via Homebrew: `brew install git`)
- **Linux**: `sudo apt install git`

### 2.3 Fazer upload dos arquivos

Abra o terminal/PowerShell na pasta `pcdeals/` e rode:

```bash
# 1. Inicializar o repositório
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o primeiro commit
git commit -m "Primeiro commit - PCDeals"

# 4. Conectar ao seu repositório do GitHub
#    (substitua SEU-USUARIO pelo seu nome de usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/pcdeals.git

# 5. Enviar os arquivos
git branch -M main
git push -u origin main
```

### 2.4 Ativar o GitHub Pages
1. No seu repositório, clique em **Settings** (aba no topo)
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Em **Branch**, selecione `main` e a pasta `/ (root)`
5. Clique em **Save**

Aguarde ~2 minutos. Seu site estará em:
```
https://SEU-USUARIO.github.io/pcdeals/
```

### 2.5 Adicionar o domínio ao Firebase (importante!)
1. Volte ao Firebase Console → **Authentication** → aba **Settings**
2. Em **Domínios autorizados**, clique **Adicionar domínio**
3. Adicione: `SEU-USUARIO.github.io`

---

## PARTE 3 — Publicar atualizações

Sempre que editar um arquivo localmente:

```bash
git add .
git commit -m "Atualização: nova promoção"
git push
```

O GitHub Pages atualiza automaticamente em ~1 minuto.

---

## PARTE 4 — Como cadastrar promoções

1. Acesse `https://SEU-USUARIO.github.io/pcdeals/admin/`
2. Faça login com o e-mail e senha que criou no Firebase
3. Preencha o formulário:
   - **Título**: nome completo do produto
   - **Loja**: KaBuM!, Pichau, Terabyte, Amazon, etc.
   - **Categoria**: selecione a mais adequada
   - **Preço original**: preço sem desconto (para calcular %)
   - **Preço promocional**: preço atual da promoção
   - **URL**: link direto para a página do produto na loja
   - **URL da imagem**: link da foto do produto (opcional, mas recomendado)
4. Clique em **Salvar promoção**

A promoção aparece instantaneamente no site!

---

## PARTE 5 — Tirar foto do produto (dica de URL de imagem)

Fontes gratuitas de imagens de produtos:
- Na página do produto na loja, clique com botão direito na foto → "Copiar endereço da imagem"
- Ou use o Google Imagens e copie a URL direta

---

## Limites gratuitos do Firebase

| Recurso | Limite gratuito (Spark) |
|---|---|
| Leituras Firestore | 50.000 / dia |
| Escritas Firestore | 20.000 / dia |
| Armazenamento | 1 GB |
| Autenticação | Ilimitado |

Para um site de promoções com tráfego normal, o plano gratuito é mais que suficiente.

---

## Resumo dos links importantes

| O quê | Link |
|---|---|
| Seu site | `https://SEU-USUARIO.github.io/pcdeals/` |
| Painel admin | `https://SEU-USUARIO.github.io/pcdeals/admin/` |
| Firebase Console | `https://console.firebase.google.com` |
| Repositório GitHub | `https://github.com/SEU-USUARIO/pcdeals` |
