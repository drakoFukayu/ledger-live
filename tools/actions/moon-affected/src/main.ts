import { execSync } from "child_process";
import * as core from "@actions/core";

async function main() {
  const ref = core.getInput("ref");

  try {
    const touchedFiles = execSync(
      `npx @moonrepo/cli query touched-files --base "develop"`
    );

    core.debug(touchedFiles.toString());

    const moonOutput = execSync(
      `npx @moonrepo/cli query projects --affected --json`,
      {
        encoding: "utf-8",
        input: touchedFiles,
        // ~10MB max size for the JSON returned by moonrepo, other we get a ENOBUFS error
        maxBuffer: 1024 * 1024 * 10,
      }
    );

    const moonAffected = JSON.parse(moonOutput);
    core.debug(moonAffected);

    if (moonAffected === null) {
      core.error(`Failed to parse JSON output from "${moonOutput}"`);
      core.setFailed("parsed JSON is null");
      return;
    }

    const { projects } = moonAffected;
    if (projects.length) {
      const affectedPackages: { [key: string]: { path: string } } = {};
      projects.forEach((proj: { source: string; alias: string }) => {
        const { alias, source } = proj;

        affectedPackages[alias] = {
          path: source,
        };
      });

      const affected = JSON.stringify(affectedPackages);
      core.info(
        `Affected packages since ${ref} (${projects.length}):\n${affected}`
      );
      core.setOutput("affected", affected);

      core.summary.addHeading("Affected Packages");
      core.summary.addRaw(
        `There are ${projects.length} affected packages since ${ref}`
      );
      core.summary.addTable([
        [{ data: "name", header: true }],
        ...Object.keys(affectedPackages).map((p) => [p]),
      ]);
    } else {
      core.info(`No packages affected since ${ref}`);
      core.setOutput("affected", JSON.stringify({}));
      core.summary.addHeading("Affected Packages");
      core.summary.addRaw(`No affected packages since ${ref}`);
    }
    core.summary.write();
  } catch (error) {
    core.error(`${error}`);
    core.setFailed(error as Error);
    return;
  }
}

main().catch((err) => {
  core.setFailed(err);
});
