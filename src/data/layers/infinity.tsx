/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion, createExponentialScaling } from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { render, renderRow } from "util/vue";
import { createLayerTreeNode, createResetButton, mergeObjects } from "../common";
import { computed, unref } from "vue";
import matter from "./matter";
import antimatter from "./antimatter";
import MatterProductDisplay from "components/MatterProductDisplay.vue";
import { trackBest } from "../../features/resources/resource";
import { createChallenge, GenericChallenge } from "../../features/challenges/challenge";
import { createTabFamily } from "../../features/tabs/tabFamily";
import { createTab } from "../../features/tabs/tab";
import { createUpgrade } from "../../features/upgrades/upgrade";

const id = "i";
const layer = createLayer(id, () => {
    const name = "Infinity";
    const color = "#CFCFCF";
    const matterColor = "#3333DC";
    const points = createResource<DecimalSource>(0, "infinity points");
    const best = trackBest(points);

    function exitChallenges(
        challengeList: Record<string, GenericChallenge>,
        except: GenericChallenge
    ) {
        Object.values(challengeList).forEach(c => {
            if (c.active.value && c.id != except.id) {
                c.active.value = false;
                c.onExit?.();
            }
        });
    }

    // matter

    const cosecantChallenge: GenericChallenge = createChallenge(() => ({
        resource: matter.points,
        goal: computed(() =>
            Decimal.pow(1e100, Decimal.add(cosecantChallenge.completions.value, 1))
        ),
        completionLimit: 10,
        display() {
            return {
                title: `Cosecant (${this.completions.value}/${unref(this.completionLimit)})`,
                description:
                    "Sine is locked to its minimum, and Cosine is locked to half its effect",
                reward: "Sine's Maximum exponent +0.1 per completion",
                goal: `${unref(this.goal)} matter`,
                effectDisplay: `+${cosecantReward.value}`
            };
        },
        onEnter() {
            exitChallenges(matterChallenges, this);
            matter.treeNode.reset.reset();
        },
        canStart() {
            return Decimal.gt(best.value, 0);
        }
    }));
    const cosecantReward = computed(() => {
        return Decimal.div(cosecantChallenge.completions.value, 10);
    });

    const secantChallenge: GenericChallenge = createChallenge(() => ({
        resource: matter.points,
        goal: computed(() => Decimal.pow(1e100, Decimal.add(secantChallenge.completions.value, 1))),
        completionLimit: 10,
        display() {
            return {
                title: `Secant (${this.completions.value}/${unref(this.completionLimit)})`,
                description: "Sine is locked to half its effect, and Cosine is locked to 0",
                reward: "Cosine's Maximum +0.01 per completion",
                goal: `${unref(this.goal)} matter`,
                effectDisplay: `+${cosecantReward.value}`
            };
        },
        onEnter() {
            exitChallenges(matterChallenges, this);
            matter.treeNode.reset.reset();
        },
        canStart() {
            return Decimal.gt(best.value, 0);
        }
    }));
    const secantReward = computed(() => {
        return Decimal.div(secantChallenge.completions.value, 100);
    });

    const hyperexponentialChallenge: GenericChallenge = createChallenge(() => ({
        resource: matter.points,
        goal: computed(() =>
            Decimal.pow(1e100, Decimal.add(hyperexponentialChallenge.completions.value, 1))
        ),
        completionLimit: 10,
        display() {
            return {
                title: `Hyperexponential (${this.completions.value}/${unref(
                    this.completionLimit
                )})`,
                description: "Exponential and Hyperbolic's effects are 1.03",
                reward: "Exponential and Hyperbolic's effects +0.01 per completion",
                goal: `${unref(this.goal)} matter`,
                effectDisplay: `+${hyperexponentialReward.value}`
            };
        },
        onEnter() {
            exitChallenges(matterChallenges, this);
            matter.treeNode.reset.reset();
        },
        canStart() {
            return Decimal.gt(best.value, 0);
        }
    }));
    const hyperexponentialReward = computed(() => {
        return Decimal.div(hyperexponentialChallenge.completions.value, 100);
    });

    const foundationlessChallenge: GenericChallenge = createChallenge(() => ({
        resource: matter.points,
        goal: computed(() =>
            Decimal.pow(1e100, Decimal.add(foundationlessChallenge.completions.value, 1))
        ),
        completionLimit: 10,
        display() {
            return {
                title: `Foundationless (${this.completions.value}/${unref(this.completionLimit)})`,
                description: "Foundation's cost is squared and effect is square rooted",
                reward: "Foundation's cost base /1.01 per completion",
                goal: `${unref(this.goal)} matter`,
                effectDisplay: `/${foundationlessReward.value}`
            };
        },
        onEnter() {
            exitChallenges(matterChallenges, this);
            matter.treeNode.reset.reset();
        },
        canStart() {
            return Decimal.gt(best.value, 0);
        }
    }));
    const foundationlessReward = computed(() => {
        return Decimal.pow(1.01, foundationlessChallenge.completions.value);
    });

    const matterChallenges = {
        cosecant: cosecantChallenge,
        secant: secantChallenge,
        hyperexponential: hyperexponentialChallenge,
        foundationless: foundationlessChallenge
    };
    const matterRewards = {
        cosecant: cosecantReward,
        secant: secantReward,
        hyperexponential: hyperexponentialReward,
        foundationless: foundationlessReward
    };

    const antiboostUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1,
        display: {
            title: "Antiboost Unlock",
            description:
                "Unlock Antiboost, which increases width based on Antimatter<br>In addition, Antimatter Unlock is always owned"
        },
        visibility: antimatter.treeNode.visibility
    }));

    const matterUpgrades = {
        antiboostUnlock: antiboostUnlockUpgrade
    };

    // remainder

    const challenges = mergeObjects([matterChallenges]);
    const challengeRewards = mergeObjects([matterRewards]);
    const upgrades = mergeObjects([matterUpgrades]);

    const challengeCompletionCount = computed(() =>
        Object.values(challenges)
            .map(c => c.completions.value)
            .reduce(Decimal.add)
    );

    const matterProduct = computed(() => {
        return [matter, antimatter]
            .filter(l => unref(l.treeNode.visibility) === Visibility.Visible)
            .map(l => Decimal.log10(Decimal.add(l.points.value, 1)))
            .reduce(Decimal.add, Decimal.dZero);
    });
    const matterProductResource = createResource(matterProduct, "matter product");

    const conversion = createCumulativeConversion(() => ({
        scaling: createExponentialScaling(10, 308),
        baseResource: matterProductResource,
        gainResource: points,
        roundUpCost: true
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset,
        visibility: computed(() =>
            Decimal.gt(best.value, 0) ? Visibility.Visible : antimatter.treeNode.visibility.value
        )
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const tabs = createTabFamily({
        matter: () => ({
            tab: createTab(() => ({
                display: jsx(() => (
                    <>
                        {renderRow(cosecantChallenge, secantChallenge)}
                        {renderRow(hyperexponentialChallenge, foundationlessChallenge)}
                        {renderRow(antiboostUnlockUpgrade)}
                    </>
                ))
            })),
            display: "Matter",
            style: { borderColor: matterColor }
        })
    });

    return {
        name,
        color,
        points,
        best,
        display: jsx(() => (
            <>
                <MatterProductDisplay />
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}
                {render(tabs)}
            </>
        )),
        treeNode,
        matterProduct,
        challenges,
        challengeRewards,
        tabs,
        upgrades
    };
});

export default layer;
