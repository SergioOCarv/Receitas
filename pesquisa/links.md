# Links de exemplo para o teste de leitura (Fase 0)

Enviados pelo Sergio em 2026-11-27. Aqui ficam só as versões limpas; os originais estão em `pesquisa/privado/` (fora do Git).

## Instagram (3)
Os três vieram como links curtos de compartilhamento (`instagram.com/share/<código>`), que redirecionam para o post.
Endereços finais, descobertos no passo 2 (só com navegador de verdade):
- https://www.instagram.com/reel/DfvB4LsMRI8/
- https://www.instagram.com/reel/Dfp_ogJMwDu/
- https://www.instagram.com/reel/DcZRp8gPcM7/

## YouTube (3)
- https://www.youtube.com/shorts/T1wIU_EYhS4 (Short; o original tinha `?si=`, removido)
- https://www.youtube.com/watch?v=ujz3WjvEmcQ
- https://www.youtube.com/watch?v=d3ErdaG2ecI

## Sites (3)
- https://www.tudogostoso.com.br/noticias/seu-misto-quente-nunca-mais-sera-o-mesmo-experimente-esta-versao-gratinada-e-cremosa-de-forno-para-o-cafe-da-manha-a32752.htm (notícia com receita, não página de receita)
- https://www.tudogostoso.com.br/receita/54191-carne-de-panela-com-batata.html
- https://www.receitasnestle.com.br/receitas/pudim-de-leite-moca (o original tinha rastreio de anúncio: `utm_*`, `gclid`, `gbraid`, `gad_*`, removidos)

## O que estes exemplos já mostram para o app
- O Instagram compartilha **links curtos** `/share/...`: o app precisa seguir o redirecionamento.
- O YouTube manda **Shorts** e o parâmetro `si` de rastreio.
- Links de anúncio chegam com muito rastreio: limpar `utm_*`, `gclid`, `gbraid`, `gad_*`, `gclsrc`, `si`, `igsh` antes de guardar e de comparar duplicidade.
- Nem toda página de site é "de receita" (a notícia do Tudo Gostoso).
