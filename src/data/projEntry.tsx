import Spacer from "components/layout/Spacer.vue";
import {jsx} from "features/feature";
import type {GenericTree} from "features/trees/tree";
import {branchedResetPropagation, createTree} from "features/trees/tree";
import type {GenericLayer} from "game/layers";
import {createLayer} from "game/layers";
import type {PlayerData} from "game/player";
import player from "game/player";
import {format, formatTime} from "util/bignum";
import {render} from "util/vue";
import {computed} from "vue";
import matter from "./layers/matter";
import antimatter from "./layers/antimatter";

/**
 * @hidden
 */
export const main = createLayer("main", () => {

    const tree = createTree(() => ({
        nodes: [[matter.treeNode, antimatter.treeNode]],
        branches: [],
        onReset() {
        },
        resetPropagation: branchedResetPropagation
    })) as GenericTree;

    return {
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
                {player.devSpeed === 0 ? <div>Game Paused</div> : null}
                {player.devSpeed && player.devSpeed !== 1 ? (
                    <div>Dev Speed: {format(player.devSpeed)}x</div>
                ) : null}
                {player.offlineTime ? (
                    <div>Offline Time: {formatTime(player.offlineTime)}</div>
                ) : null}
                <Spacer />
                {render(tree)}
            </>
        )),
        tree
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [main, matter, antimatter];

/**
 * A computed ref whose value is true whenever the game is over.
 */
export const hasWon = computed(() => {
    return matter.upgradeData.antimatterUnlock.bought.value;
});

/**
 * Given a player save data object being loaded with a different version, update the save data object to match the structure of the current version.
 * @param oldVersion The version of the save being loaded in
 * @param player The save data being loaded in
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
