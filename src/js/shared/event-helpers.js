import { getSeriesMetadata } from "../data/data-store.js";
import eventBlueprints from "../../../conf/event_blueprints.json" with { type: "json" };

/**
 * Returns the duration of an event in minutes by reading its mechanics blueprint.
 * Falls back to 240 minutes if metadata or mechanics cannot be resolved.
 */
export function getEventDuration(site, seriesId) {
    const metadata = getSeriesMetadata(seriesId);
    if (!metadata?.shardComponents) return 240;

    const component = metadata.shardComponents.find(c => c.eventType === site.eventType);
    if (!component) return 240;

    const mechanicsId = component.shardMechanics || component.targetMechanics;
    const mechanics = eventBlueprints.mechanics.shards[mechanicsId] || eventBlueprints.mechanics.targets[mechanicsId];

    if (!mechanics) return 240;

    const lastWaveStart = mechanics.waves ? Math.max(...mechanics.waves.map(w => w.startOffset || 0)) : 0;

    // Based on requirement: Active time = last jump within a shards blueprint + 1 hour
    const jumpActions = mechanics.waveActions?.filter(a => a.action === 'jump') || [];
    if (jumpActions.length > 0) {
        const lastJumpOffset = Math.max(...jumpActions.map(a => a.time));
        return lastWaveStart + lastJumpOffset + 1; // +1 minute
    }

    const despawnAction = mechanics.waveActions?.find(a => a.action === 'despawn');
    if (despawnAction) {
        return lastWaveStart + despawnAction.time;
    }

    if (mechanics.waves) {
        return Math.max(...mechanics.waves.map(w => w.endOffset || 0));
    }

    return 240;
}
