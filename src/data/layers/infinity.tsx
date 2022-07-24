/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import {createCumulativeConversion, createExponentialScaling, createPolynomialScaling} from "features/conversion";
import {jsx, Visibility} from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import {computed} from "vue";
import Decimal from "util/bignum";
import matter from "./matter";
import antimatter from "./antimatter";
import MatterProductDisplay from "components/MatterProductDisplay.vue";
import {trackBest} from "../../features/resources/resource";

const id = "i";
const layer = createLayer(id, () => {
    const name = "Infinity";
    const color = "#CFCFCF";
    const points = createResource<DecimalSource>(0, "infinity points");
    const best = trackBest(points)

    const matterProduct = computed(() => {
        let product = Decimal.log10(Decimal.add(matter.points.value, 1))
        product = product.add(Decimal.log10(Decimal.add(antimatter.points.value, 1)))

        return product
    })
    const matterProductResource = createResource(matterProduct, "matter product")

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
        visibility: computed(() => Decimal.gt(best.value, 0) ? Visibility.Visible : antimatter.treeNode.visibility.value)
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

    return {
        name,
        color,
        points,
        best,
        display: jsx(() => (
            <>
                <MatterProductDisplay/>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}
            </>
        )),
        treeNode,
        matterProduct
    };
});

export default layer;