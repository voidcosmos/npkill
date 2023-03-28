**_(Este doc está en proceso de desarrollo)_**

# Cómo contribuir a NPKILL 🎉

Sé que lo que voy a decir es lo típico, pero es realmente maravilloso que estés leyendo estas líneas. Quiere decir que estás interesad@ en ayudar a mejorar Npkill, _o quizá simplemente estés aquí por curiosidad `cof cof`_.

Sea por la razón que sea, eres bienvenid@. A continuación te explico las pautas recomendadas a la hora de contribuir. 

---

# Consideraciones habituales

- Seguir este protocolo ayuda a evitar trabajar en vano. Sería una pena dedicar horas a un pull request y que tengamos que rechazarlo porque ya hay alguien trabajando en un issue similar.

- A no ser que sean modificaciones menores y rápidas, intenta informar a todo el mundo de que estás modificando algo. Para ello puedes abrir un issue, o consultar los [proyectos](https://github.com/voidcosmos/npkill/projects).

- Cambia únicamente las líneas que sean necesarias para llevar a cabo la modificación. Esto ayudará a evitar conflictos, y en el caso de que exista alguno, será más fácil de solucionar.

- Asegúrate de ejecutar `npm install`, ya que algunos paquetes de desarrollo existen para mantener la armonía. Prettier, por ejemplo, se asegura en cada commit de que los ficheros tienen la sangría correctamente, y Commitlint se asegura de que los mensajes de commit siguen la convención.

- Siempre que sea posible, añade tests, tests y... ¡Más tests! tests tests tests tests tests tests tests tests tests tests tests

# Nueva feature

1. Si quieres contribuir con una nueva feature, asegúrate de que no hay un issue anterior de otra persona trabajando en lo mismo.

2. Si no hay, abre un issue explicando lo que quieres incorporar, y los ficheros que, a priori, creas que tendrás que modificar.

3. Espera a que la comunidad se pronuncie, y a que algún miembro apruebe tu propuesta (decisión que se tendrá un cuenta por la comunidad).

¡Bien! ¡Luz verde para picar!

4. Haz un fork de este proyecto.

5. Crea una nueva rama siguiendo las convenciones recomendadas. 

6. Escribe el código y crea commits de forma regular siguiendo la convención recomendada.

7. Crea un PULL REQUEST utilizando **master como rama base**. 
    Como título, utiliza uno igual o similar al que utilizaste en la creación del issue, y en la descripción, cualquier información que consideres relevante junto al enlace al issue y el mensaje "close". Ejemplo: close #numeroIssue
    [más info](https://help.github.com/en/articles/closing-issues-using-keywords)

# Convenciones

## Ramas de git

Recomendamos utilizar la siguiente nomenclatura siempre que sea posible:

- feat/sort-results
- fix/lstat-crash
- docs/improve-readme

## Mensajes de git

Asegúrate de pensar bien el mensaje de cada commit.
Todos los commits deben utilizar una convención similar a la de `Angular`. [Aquí tienes todas las reglas](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum)

- Utiliza el presente ("add feature", no "added feature")
- Utiliza el imperativo ("move cursor to", no "moves cursor to")
- Limita la primera línea a 72 caracteres o menos
- Referencia issues y pull request tanto como quieras tras la primera línea


  _[Some points extracted from Atom doc](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)_

## Código

Es importante aplicar los principios del código limpio.

Si utilizas `VS Code`, a continuación tienes algunos add-ons que recomendamos:
- TSLint: Te permite saber si estás incumpliendo algunas de las _reglas de código_ (no utilizar var, utilizar const siempre que sea posible, tipar siempre las variables etc.)

- CodeMetrics: Calcula la complejidad de los métodos, para asegurar que cada función hace únicamente 1 cosa. (verde es ok, amarillo es meh, rojo es oh god why)

Si utilizas otro IDE, probablemente haya add-ons parecidos disponibles.