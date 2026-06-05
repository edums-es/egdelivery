# EG Delivery Print Agent

Agente local para imprimir automaticamente pedidos aceitos no EG Delivery.

## Como usar no Windows

1. No painel, abra `Configuracoes > Impressao`.
2. Ative a automacao, configure o nome da impressora e copie o token do agente.
3. No computador conectado a impressora, rode:

```powershell
$env:EG_PRINT_API="https://SEU_BACKEND/api"
$env:EG_PRINT_TOKEN="TOKEN_COPIADO_NO_PAINEL"
$env:EG_PRINTER_NAME="NOME EXATO DA IMPRESSORA"
npm start
```

Para usar a impressora padrao do Windows, deixe `EG_PRINTER_NAME` vazio.

Para listar impressoras instaladas:

```powershell
npm run printers
```

## Variaveis

- `EG_PRINT_API`: URL base da API, terminando em `/api`.
- `EG_PRINT_TOKEN`: token gerado em `Configuracoes > Impressao`.
- `EG_PRINTER_NAME`: nome da impressora no Windows. Opcional.
- `EG_PRINT_POLL_MS`: intervalo de consulta. Padrao `5000`.
- `EG_PRINT_AGENT_ID`: identificador do agente. Opcional.
