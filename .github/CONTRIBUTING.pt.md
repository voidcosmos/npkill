# Como contribuir para o NPKILL 🎉

Eu sei que o que vou dizer pode parecer algo típico, mas estou sinceramente feliz por você estar lendo estas linhas, porque isso significa que você está interessado em ajudar a melhorar o Npkill, _ou talvez você esteja aqui apenas por curiosidade `cof cof`_.
De qualquer forma, você é muito bem-vindo. Vou tentar explicar as diretrizes recomendadas para contribuir.

## Considerações comuns

- Seguir este protocolo ajuda a evitar trabalhar em vão. Seria uma pena dedicar horas a um pull request e ter que recusá-lo porque já existe alguém trabalhando em uma issue semelhante.

- A menos que sejam modificações pequenas e rápidas, tente avisar a todos que você está modificando algo abrindo uma issue, por exemplo, ou consultando os [projetos](https://github.com/voidcosmos/npkill/projects).

- Altere apenas as linhas necessárias para a sua modificação. Isso ajuda a evitar conflitos e, caso existam, torna mais fácil resolvê-los.

- Certifique-se de executar `npm install`, porque alguns pacotes de desenvolvimento são usados para manter a harmonia. O Prettier, por exemplo, garante que todos os arquivos fiquem bem indentados em cada commit, e o Commitlint garante que suas mensagens sigam a convenção.

- Sempre que possível, escreva testes, testes e mais testes! testes testes testes testes testes testes testes testes testes testes testes.

## Nova funcionalidade

1. Se você quiser contribuir com uma nova funcionalidade, certifique-se de que não exista uma issue anterior com alguém trabalhando na mesma funcionalidade.

2. Em seguida, abra uma issue explicando o que você deseja incorporar e os arquivos que você acha que precisará modificar a priori.

3. Aguarde a comunidade dar uma opinião e algum membro aprovar sua proposta (uma decisão que será tomada pela comunidade e pelos planos futuros).

4. Faça um fork deste projeto.

5. Crie uma nova branch seguindo as [convenções recomendadas](#convenções).

6. Escreva o código e crie commits regularmente seguindo a [convenção recomendada](#convenções).

7. Crie um PULL REQUEST usando **main como branch base**.
   Como título, use o mesmo (ou semelhante) que você usou na criação da issue, e na descrição, qualquer informação que você considere relevante junto com o link da issue e o texto "close" (exemplo: close #issueNumber) [mais informações](https://help.github.com/en/articles/closing-issues-using-keywords).

## Convenções

### branch do git

Eu recomendo usar a seguinte nomenclatura sempre que possível:

- feat/sort-results
- fix/lstat-crash
- docs/improve-readme

### mensagens de commit

Certifique-se de reservar um tempo para pensar na mensagem de cada commit.
Todos os commits devem usar uma convenção semelhante à do Angular. [Aqui estão todas as regras](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum)

- Use o tempo presente ("add feature" e não "added feature")
- Use o modo imperativo ("move cursor to..." e não "moves cursor to...")
- Limite a primeira linha a 72 caracteres ou menos
- Faça referência a issues e pull requests liberalmente após a primeira linha

  _[Alguns pontos extraídos do documento do Atom](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)_

### código

É importante aplicar os princípios de código limpo.

Se você usar o VS Code, existem algumas extensões que eu recomendo:

- **TSLint**: informa se você está quebrando alguma das _regras de codificação_ (não use var, use const quando possível, se algum tipo não foi definido etc.)

- **CodeMetrics**: calcula a complexidade dos métodos, para garantir que suas funções façam apenas uma coisa. (verde é ok, amarelo é mediano, vermelho é “meu Deus, por quê?”)

Se você usar outra IDE, provavelmente existem extensões semelhantes disponíveis.
