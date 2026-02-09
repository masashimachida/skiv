import Command from "./Command";
export default class StartCommand extends Command {
    /**
     * Executes the primary workflow, including initializing resources, migrating the database to the latest schema,
     * setting up the tmux grid, and configuring individual workspaces for team members.
     *
     * @return {Promise<void>} A promise that resolves when the execution of the workflow is completed.
     */
    execute(): Promise<void>;
    /**
     * Creates a new workspace by copying role-specific files to the workspace directory.
     *
     * @param {string} rootDir - The root directory of the project.
     * @param {string} name - The name of the workspace to be created.
     * @param {string} role - The role associated with the workspace, used to determine the base template.
     * @return {string} The path to the created workspace directory.
     */
    private createWorkspace;
    /**
     * Sets up a tmux grid layout by splitting the tmux window vertically multiple times,
     * arranging the panes in a main-horizontal layout, and adjusting the main pane's height.
     *
     * @param {number} paneCount - The total number of panes to create in the tmux grid.
     * @return {void} No return value.
     */
    private setupTmuxGrid;
}
//# sourceMappingURL=StartCommand.d.ts.map