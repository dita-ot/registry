# DITA Open Toolkit Plug-in Registry

This repository serves as the data backend for the DITA-OT plug-in registry.

The registry provides a searchable list of plug-ins at [dita-ot.org/plugins](https://www.dita-ot.org/plugins), which makes it easier to discover and install new plug-ins for DITA Open Toolkit.

<!-- MarkdownTOC levels="2" -->

- [Adding plug-ins to the registry](#adding-plug-ins-to-the-registry)
- [Contribution Guidelines](#contribution-guidelines)

<!-- /MarkdownTOC -->

---

![DITA-OT plug-in registry](https://user-images.githubusercontent.com/129995/48142257-bee91a00-e2ac-11e8-877e-827d2471fec6.png)

---

## Adding plug-ins to the registry

The entries for each plug-in are stored in a file named after the plug-in ID as `<plugin-name>.json`.

To add a plug-in, [fork][1] this repository, create a new plug-in entry file  in JSON format, and send a [pull request][2]. 

For details on the file format, see [Publishing plug-ins to the registry][3] in the DITA-OT documentation.

## Contribution Guidelines

This repository follows the [DITA-OT Contribution Guidelines][4], summarized below: 

- If you find a bug or would like to suggest a change, [create an issue][5].  
  _(If it's a bug, provide steps to recreate the issue.)_

- To add a new plug-in or new version, [submit a pull request][2] with the proposed changes. Create separate pull request for each plug-in version.

- Indicate that you agree to the terms of the Apache License Version 2.0 by "[signing off][6]" your contribution with `git commit -s`.

    This adds a line with your name and e-mail address to your Git commit message:

    ```bash
     Signed-off-by: Jane Doe <jane.doe@example.com>
    ```

[1]: https://help.github.com/articles/fork-a-repo/
[2]: https://help.github.com/articles/about-pull-requests/
[3]: https://www.dita-ot.org/dev/topics/plugins-registry.html#plugin-registry__publishing-to-registry 
[4]: https://github.com/dita-ot/dita-ot/blob/develop/.github/CONTRIBUTING.md
[5]: https://github.com/dita-ot/registry/issues/new
[6]: https://www.dita-ot.org/DCO

