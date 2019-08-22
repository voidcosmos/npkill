**_(this doc is under construction)_**

# How to contribute on NPKILL 🎉

I know that what I am going to say sounds like something typical, but I am sincerely glad that you are reading this, because that means that you are interested in contributing your grain of sand to improve it, _or you may simply be here for curiosity `cof cof`_.
Anyway, be welcome. I will try to explain the recommended guidelines to contribute.

---

# Common considerations

- Following this protocol helps not work in vain. It would be a shame to dedicate hours to a pull request and have to reject it because there is already someone working on something similar.

- Touch only the right and necessary lines for your modification. This will help to avoid conflicts, and if there were any, it will be easier to solve them.

- Make sure you have run `npm install`, because some development packages are meant to maintain harmony. Prettier for example makes sure that in each commit the files are well indented and commitlint that their messages follow the convention.

- Whenever possible, write test, test and more test! test test test test test test test test test test test

# New feature

1. If you want to contribute a new feature, make sure before there is an issue of someone working on the same feature.

2. Then, open an issue explaining what you want to incorporate, and the files that you think you will need to modify a priori.

3. Wait for the community to give a opinion, and for some member to approve your proposal (a decision that will be taken taking into the community and future plans).

Yay! Green light to work!

4. Fork this project.

5. Create a new branch following the [recommended conventions]()

6. Write code and create commit regularly following the [recommended convention]()

7. Create a PULL REQUEST using **DEVELOP as the base branch**.
   As a title, use the same or similar to the one you used in the creation of the issue, and in the description, any information that you consider relevant next to the link of the issue (example: #issueNumber)

# Conventions

## git messages

Be sure to take the time to think about the message for each commit.
All commits must use a convention similar to angular. [Here all the rules](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional#type-enum)

- Use the present tense ("add feature" not "added feature")
- Use the imperative mood ("move cursor to..." not "moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:

  - :art: `:art:` when improving the format/structure of the code
  - :racehorse: `:racehorse:` when improving performance
  - :non-potable_water: `:non-potable_water:` when plugging memory leaks
  - :memo: `:memo:` when writing docs
  - :penguin: `:penguin:` when fixing something on Linux
  - :apple: `:apple:` when fixing something on macOS
  - :checkered_flag: `:checkered_flag:` when fixing something on Windows
  - :bug: `:bug:` when fixing a bug
  - :fire: `:fire:` when removing code or files
  - :green_heart: `:green_heart:` when fixing the CI build
  - :white_check_mark: `:white_check_mark:` when adding tests
  - :lock: `:lock:` when dealing with security
  - :arrow_up: `:arrow_up:` when upgrading dependencies
  - :arrow_down: `:arrow_down:` when downgrading dependencies
  - :shirt: `:shirt:` when removing linter warnings

  _[Some points extracted from Atom doc](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)_

## code
