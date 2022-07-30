/**
 * @module
 * @hidden
 */
import { jsx, Visibility } from "features/feature";
import { createReset, trackResetTime } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { BaseLayer, createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal, { format } from "util/bignum";
import { createLayerTreeNode, infiniteSoftcap } from "../common";
import { createBuyable, GenericBuyable } from "../../features/buyable";
import { render, renderRow } from "../../util/vue";
import {capitalize, computed, ComputedRef, unref} from "vue";
import player from "../../game/player";
import { createUpgrade } from "../../features/upgrades/upgrade";
import { createMilestone, GenericMilestone } from "../../features/milestones/milestone";
import { GenericClickable, setupAutoClick } from "../../features/clickables/clickable";
import infinity from "./infinity";
import { Computable } from "../../util/computed";
import MatterDimensionDisplay from "components/MatterDimensionDisplay.vue";
import antimatter from "./antimatter";
import { globalBus } from "../../game/events";

const id = "m";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Matter";
    const color = "#336BDC";

    function buyableCost(buyable: GenericBuyable, base: number, exponent: number, initialCost = 1) {
        return function () {
            if (!buyable.amount) return Decimal.dInf;
            let count = buyable.amount.value;
            count = Decimal.sub(count, cosineEffect.value);

            let cost = Decimal.pow(
                base,
                Decimal.mul(Decimal.sign(count), Decimal.pow(Decimal.abs(count), exponent))
            );
            cost = Decimal.div(cost, exponentialEffect.value).mul(initialCost);
            return cost;
        };
    }

    // shared variables
    const dimensionalGenerator = computed(() => {
        return Decimal.clamp(Decimal.add(Decimal.div(resetTime.value, 60), 1), 1, 1000);
    });

    // upgrades

    const sineBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 10e3,
        display: {
            title: "Sine Boost",
            description: `Multiply Sine's minimum by 1.5 and maximum by 2, per upgrade bought`
        }
    }));

    const sineFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 10e6,
        display: {
            title: "Sine Foundation",
            description: `Multiply Sine's minimum by 1.02 and maximum by 1.05, per Foundation bought`
        }
    }));

    const logarithmUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e3,
        display: {
            title: "Logarithm Unlock",
            description: `Unlock Logarithm, which increases Foundation's effect based on matter`
        }
    }));

    const logarithmBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 100e3,
        display: {
            title: "Logarithm Boost",
            description: `Increase Logarithm's exponent by 0.25 per upgrade bought`
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const logarithmFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e18,
        display: {
            title: "Logarithm Foundation",
            description: `Increase Logarithm's exponent by 0.01 per Foundation bought, up to 40`
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const cosineUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e11,
        display: {
            title: "Cosine Unlock",
            description: `Unlock Cosine, which decreases buyable levels for cost purposes`
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const cosineBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e12,
        display: {
            title: "Cosine Boost",
            description: `Increase Cosine's limit by 0.01 per upgrade bought`
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const cosineFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e39,
        display: {
            title: "Cosine Foundation",
            description: `Increase Cosine's limit by 0.0001 per Foundation bought, up to 0.2`
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const exponentialUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e14,
        display: {
            title: "Exponential Unlock",
            description: `Unlock Exponential, which decreases buyable costs`
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const exponentialBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e16,
        display: {
            title: "Exponential Boost",
            description: `Gain 10 free levels of Exponential per upgrade bought`
        },
        visibility() {
            return exponentialUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const exponentialFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e53,
        display: {
            title: "Exponential Foundation",
            description: `Increase Exponential's effect by 0.00001 per Foundation bought, up to 0.02`
        },
        visibility() {
            return exponentialUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const hyperbolicUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e30,
        display: {
            title: "Hyperbolic Unlock",
            description: `Unlock Hyperbolic, which increases Sine's min and max based on matter`
        },
        visibility() {
            return exponentialUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const hyperbolicBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e48,
        display: {
            title: "Hyperbolic Boost",
            description: `Increase Hyperbolic's exponent to minimum 0.01 per upgrade bought`
        },
        visibility() {
            return hyperbolicUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const hyperbolicFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e77,
        display: {
            title: "Hyperbolic Foundation",
            description: `Increase Hyperbolic's effect by 0.00001 per Foundation bought, up to 0.03`
        },
        visibility() {
            return hyperbolicUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const antimatterUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e100,
        display: {
            title: "Antimatter Unlock",
            description: `Unlock Antimatter, which is a new layer`
        },
        visibility() {
            return this.bought.value || hyperbolicUnlockUpgrade.bought.value
                ? Visibility.Visible
                : Visibility.None;
        }
    }));

    const upgradeData = {
        sineBoost: sineBoostUpgrade,
        sineFoundation: sineFoundationUpgrade,
        logarithmUnlock: logarithmUnlockUpgrade,
        logarithmBoost: logarithmBoostUpgrade,
        logarithmFoundation: logarithmFoundationUpgrade,
        cosineUnlock: cosineUnlockUpgrade,
        cosineBoost: cosineBoostUpgrade,
        cosineFoundation: cosineFoundationUpgrade,
        exponentialUnlock: exponentialUnlockUpgrade,
        exponentialBoost: exponentialBoostUpgrade,
        exponentialFoundation: exponentialFoundationUpgrade,
        hyperbolicUnlock: hyperbolicUnlockUpgrade,
        hyperbolicBoost: hyperbolicBoostUpgrade,
        hyperbolicFoundation: hyperbolicFoundationUpgrade,
        antimatterUnlock: antimatterUnlockUpgrade
    };

    const upgradeCount = computed(() => {
        return Object.values(upgradeData).filter(u => u.bought.value).length;
    });

    // buyables

    const foundationLength = computed(() => {
        let foundationLength = new Decimal(1);
        foundationLength = foundationLength.add(
            Decimal.mul(logarithmBuyable.amount.value, logarithmLength.value)
        );

        if (infinity.challenges.foundationless.active.value)
            foundationLength = foundationLength.sqrt();

        return foundationLength;
    });

    const foundationBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            const cost = buyableCost(foundationBuyable, 1.2, 1.02)();

            if (infinity.challenges.foundationless.active.value) return cost.sqr();

            return cost;
        },
        display() {
            return {
                title: "Foundation",
                description: `Increases length by ${format(foundationLength.value)}`
            };
        }
    }));

    const logarithmExponent = computed(() => {
        let exp = new Decimal(1);
        if (logarithmBoostUpgrade.bought.value) exp = exp.add(Decimal.div(upgradeCount.value, 4));
        if (logarithmFoundationUpgrade.bought.value)
            exp = exp.add(Decimal.min(40, Decimal.div(foundationBuyable.amount.value, 100)));
        return exp;
    });

    const logarithmLength = computed(() => {
        return infiniteSoftcap(
            Decimal.div(
                Decimal.pow(Decimal.log10(Decimal.max(100, points.value)), logarithmExponent.value),
                10
            )
        );
    });

    const logarithmBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(logarithmBuyable, 1.4, 1.02),
        display() {
            return {
                title: "Logarithm",
                description: `Increases Foundation's effect by log<sub>10</sub>(m)<sup>${format(
                    logarithmExponent.value
                )}</sup>/10<br>`,
                effectDisplay: `+${format(logarithmLength.value)}`
            };
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const exponentialBase = computed(() => {
        let base = new Decimal(1.05);

        if (infinity.challenges.hyperexponential.active.value) return new Decimal(1.03);

        base = base.add(infinity.challengeRewards.hyperexponential.value);

        if (exponentialFoundationUpgrade.bought.value)
            base = base.add(
                Decimal.min(0.02, Decimal.mul(foundationBuyable.amount.value, 0.00001))
            );

        return base;
    });
    const exponentialEffect = computed(() => {
        let levels = exponentialBuyable.amount.value;

        if (exponentialBoostUpgrade.bought.value)
            levels = Decimal.add(levels, Decimal.mul(upgradeCount.value, 10));

        return infiniteSoftcap(Decimal.pow(exponentialBase.value, levels));
    });

    const exponentialBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(exponentialBuyable, 1.6, 1.02),
        display() {
            return {
                title: "Exponential",
                description: `Divides all matter buyable costs by ${format(exponentialBase.value)}`
            };
        },
        visibility() {
            return exponentialUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const sineMin = computed(() => {
        let count = new Decimal(0.1);

        count = count.mul(Decimal.pow(hyperbolicEffect.value, hyperbolicMinExponent.value));

        if (sineFoundationUpgrade.bought.value)
            count = count.mul(Decimal.pow(1.02, foundationBuyable.amount.value));
        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(1.5, upgradeCount.value));

        return infiniteSoftcap(count);
    });
    const sineMax = computed(() => {
        let count = new Decimal(1);

        count = count.mul(hyperbolicEffect.value);

        if (sineFoundationUpgrade.bought.value)
            count = count.mul(Decimal.pow(1.05, foundationBuyable.amount.value));
        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(2, upgradeCount.value));

        return infiniteSoftcap(count);
    });

    const tempo = computed(() => {
        if (infinity.challenges.cosecant.active.value) return -Math.PI / 2;
        if (infinity.challenges.secant.active.value) return -Math.PI;

        return (player.time * Math.PI) / 180 / 120;
    });

    const sineTempo = computed(() => {
        return (Math.sin(tempo.value) + 1) / 2;
    });
    const sineValue = computed(() => {
        const min = Decimal.log10(sineMin.value);
        const delta = Decimal.log10(sineMax.value).minus(min);

        return Decimal.dTen.pow(min.plus(delta.mul(sineTempo.value)));
    });

    const sineBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(sineBuyable, 1.25, 1.05),
        display() {
            return {
                title: "Sine",
                description: `Increases width by between ${format(sineMin.value)} to ${format(
                    sineMax.value
                )}`,
                effectDisplay: `+${format(sineValue.value)}`
            };
        }
    }));

    const cosineTempo = computed(() => {
        return (Math.cos(tempo.value) + 1) / 2;
    });
    const cosineLimit = computed(() => {
        let limit = new Decimal(0.15);

        if (cosineBoostUpgrade.bought.value)
            limit = Decimal.add(limit, Decimal.div(upgradeCount.value, 100));
        if (cosineFoundationUpgrade.bought.value)
            limit = Decimal.add(
                limit,
                Decimal.min(Decimal.mul(foundationBuyable.amount.value, 0.0001), 0.2)
            );

        return limit;
    });
    const cosineValue = computed(() => {
        return Decimal.mul(cosineTempo.value, cosineLimit.value);
    });
    const cosineEffect = computed(() => {
        return Decimal.mul(cosineBuyable.amount.value, cosineValue.value);
    });

    const cosineBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(cosineBuyable, 1.5, 1.05),
        display() {
            return {
                title: "Cosine",
                description: `Decreases buyable count for cost purposes of all matter buyables, by up to ${format(
                    cosineLimit.value
                )}`,
                effectDisplay: `-${format(cosineValue.value)}`
            };
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const hyperbolicValue = computed(() => {
        let base = new Decimal(1.03);

        if (infinity.challenges.hyperexponential.active.value) return new Decimal(1.03);

        base = base.add(infinity.challengeRewards.hyperexponential.value);

        if (hyperbolicFoundationUpgrade.bought.value)
            base = base.add(
                Decimal.min(0.03, Decimal.mul(foundationBuyable.amount.value, 0.00001))
            );

        return base;
    });
    const hyperbolicEffect = computed(() => {
        return infiniteSoftcap(Decimal.pow(hyperbolicValue.value, hyperbolicBuyable.amount.value));
    });
    const hyperbolicMinExponent = computed(() => {
        let exp = new Decimal(0.5);

        if (hyperbolicBoostUpgrade.bought.value)
            exp = exp.add(Decimal.div(upgradeCount.value, 100));

        return exp;
    });

    const hyperbolicBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(hyperbolicBuyable, 1.75, 1.05),
        display() {
            return {
                title: "Hyperbolic",
                description: `Multiplies Sine's maximum by ${format(
                    hyperbolicValue.value
                )}, and min by ^${format(hyperbolicMinExponent.value)} of that`
            };
        },
        visibility() {
            return hyperbolicUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None;
        }
    }));

    const antiboostBase = computed(() => {
        return Decimal.add(antimatter.points.value, 10).log10().div(1000).add(1);
    });
    const antiboostEffect = computed(() => {
        return infiniteSoftcap(Decimal.pow(antiboostBase.value, antiboostBuyable.amount.value));
    });
    const antiboostBuyable: GenericBuyable = createBuyable(() => ({
        resource: points,
        cost: buyableCost(antiboostBuyable, 3, 1.1),
        display() {
            return {
                title: "Antiboost",
                description: "Multiplies height by 1 + log<sub>10</sub>(am)/1000",
                effectDisplay: `x${format(antiboostBase.value)}`
            };
        },
        visibility() {
            return infinity.upgrades.antiboostUnlock.bought.value
                ? Visibility.Visible
                : Visibility.None;
        }
    }));

    const buyableData: Record<string, GenericBuyable> = {
        foundation: foundationBuyable,
        logarithm: logarithmBuyable,
        exponential: exponentialBuyable,
        sine: sineBuyable,
        cosine: cosineBuyable,
        hyperbolic: hyperbolicBuyable,
        antiboost: antiboostBuyable
    };

    // milestones

    const milestoneData: Record<string, GenericMilestone> = {};

    Object.entries(buyableData).forEach(([k, b]) => {
        const capitalized = capitalize(k);
        const milestone = createMilestone(() => ({
            shouldEarn() {
                return Decimal.gte(b.amount.value, 200);
            },
            display: {
                requirement: "200 " + capitalized,
                effectDisplay: "Autobuy " + capitalized
            },
            style: {
                width: "250px"
            }
        }));
        setupAutoClick(this, b as unknown as GenericClickable, milestone.earned);
        milestoneData[k] = milestone;
    });

    // points

    const length = computed(() => {
        let base = dimensionalGenerator.value;
        base = base.add(Decimal.mul(foundationBuyable.amount.value, foundationLength.value));
        return base;
    });
    const width = computed(() => {
        let base = dimensionalGenerator.value;
        base = base.add(Decimal.mul(sineValue.value, sineBuyable.amount.value));
        return base;
    });
    const height = computed(() => {
        let base = dimensionalGenerator.value;

        if (infinity.upgrades.antiboostUnlock.bought.value) base = base.mul(antiboostEffect.value);

        return base;
    });
    const hyper = computed(() => {
        const base = dimensionalGenerator.value;
        return base;
    });

    const dimensions: Record<
        string,
        { value: ComputedRef<DecimalSource>; color: string; visible: Computable<boolean> }
    > = {
        width: {
            value: width,
            color: color,
            visible: true
        },
        length: {
            value: length,
            color: color,
            visible: true
        },
        height: {
            value: height,
            color: color,
            visible: true
        },
        hyper: {
            value: hyper,
            color: "#3333DC",
            visible: computed(() => unref(infinity.treeNode.visibility) == Visibility.Visible)
        }
    };

    const points = createResource<DecimalSource>(
        computed(() => {
            return Object.entries(dimensions)
                .filter(d => d[1].visible)
                .map(d => unref(d[1].value) as DecimalSource)
                .reduce(Decimal.mul, Decimal.dOne);
        }),
        "matter"
    );

    // serialization and stuff

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    const resetTime = trackResetTime(this, reset);

    globalBus.on("reset", r => {
        if (r.id == reset.id) {
            antimatterUnlockUpgrade.bought.value = true;
        }
    });

    const dimensionalGeneratorDisplay = jsx(() => (
        <>
            <span>
                <div>The dimensional generator has ran for {format(resetTime.value)} seconds.</div>
                <div>
                    This results in +<span>{format(dimensionalGenerator.value)}</span> to all
                    directions
                </div>
            </span>
        </>
    ));

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <MatterDimensionDisplay />
                <MainDisplay resource={points} color={color} />
                {render(dimensionalGeneratorDisplay)}
                {renderRow(foundationBuyable, logarithmBuyable, exponentialBuyable)}
                {renderRow(sineBuyable, cosineBuyable, hyperbolicBuyable)}
                {renderRow(antiboostBuyable)}
                {renderRow(
                    sineBoostUpgrade,
                    logarithmBoostUpgrade,
                    cosineBoostUpgrade,
                    exponentialBoostUpgrade,
                    hyperbolicBoostUpgrade
                )}
                {renderRow(
                    sineFoundationUpgrade,
                    logarithmFoundationUpgrade,
                    cosineFoundationUpgrade,
                    exponentialFoundationUpgrade,
                    hyperbolicFoundationUpgrade
                )}
                {renderRow(
                    logarithmUnlockUpgrade,
                    cosineUnlockUpgrade,
                    exponentialUnlockUpgrade,
                    hyperbolicUnlockUpgrade,
                    antimatterUnlockUpgrade
                )}
                {renderRow(
                    milestoneData.foundation,
                    milestoneData.logarithm,
                    milestoneData.exponential
                )}
                {renderRow(milestoneData.sine, milestoneData.cosine, milestoneData.hyperbolic)}
                {renderRow(milestoneData.antiboost)}
            </>
        )),
        treeNode,
        upgradeData,
        buyableData,
        milestoneData,
        resetTime,
        dimensions
    };
});

export default layer;
