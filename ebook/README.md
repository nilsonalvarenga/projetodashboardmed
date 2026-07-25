# E-book — Como Se Tornar um Ímã para o que Você Deseja

E-book em português (40 páginas) inspirado nos ensinamentos de **David Bayer**
na entrevista *"Como se tornar um ímã para o que você deseja"*, concedida a
**Lewis Howes** no podcast *The School of Greatness*.

> Vídeo original: https://www.youtube.com/watch?v=MgDSRCK-hrk

## Arquivos

| Arquivo | Descrição |
|---|---|
| **`Como-Se-Tornar-um-Ima-David-Bayer.pdf`** | O e-book final, pronto para leitura/distribuição (formato de livro 152 × 229 mm). |
| `magnetismo-pessoal.html` | Código-fonte do e-book (HTML + CSS autocontido, com as fontes referenciadas em `assets/`). |
| `build.py` | Script que renderiza o HTML em PDF, preenche os números de página do sumário e adiciona os marcadores (bookmarks) e metadados do PDF. |
| `assets/fonts/` | Fontes tipográficas (Playfair Display, Lora, Montserrat — licença SIL OFL). |

## Conteúdo

- **Introdução** — A realidade é generosa
- **Parte I · O mecanismo do magnetismo**
  1. A Equação de Ouro — *Desejo + Não Resistência = Resultado Desejado*
  2. Estados Primais e Estados Poderosos
- **Parte II · As raízes da resistência**
  3. A Ferida Central da Infância
  4. Vícios, Sofrimento e a Arte da Entrega
- **Parte III · A reprogramação**
  5. Crenças São Decisões — A Matriz de Decisão
  6. Torne-se o Ímã — Plano prático de 30 dias
- **Kit de Ferramentas Rápidas**

Cada capítulo traz uma **Prática** aplicável, uma lista de **Pontos-chave** e um
selo com o horário do momento correspondente na entrevista original (links
clicáveis no PDF).

## Como reconstruir o PDF

Requisitos: Chromium (para renderização HTML→PDF) e Python com PyMuPDF.

```bash
pip install PyMuPDF
python3 build.py            # gera Como-Se-Tornar-um-Ima-David-Bayer.pdf
python3 build.py --preview 1,6,9   # também exporta PNGs de páginas para conferência
```

O caminho do executável do Chromium está definido no topo de `build.py`
(variável `CHROME`); ajuste-o conforme o seu ambiente, se necessário.

## Aviso

Este é um material **educativo e independente**, escrito com palavras próprias
para fins de estudo e síntese. **Não é oficial** nem possui vínculo, endosso ou
revisão de David Bayer, de Lewis Howes ou de suas equipes. Os conceitos
pertencem aos seus autores. Para a fonte completa, assista ao episódio original.

O conteúdo não substitui acompanhamento médico, psicológico ou psiquiátrico.
