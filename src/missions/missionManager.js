const MISSION = {
  id: 'a-fresh-start',
  title: 'A FRESH START',
  reward: 500
};

export function createMissionManager(onChange = () => {}) {
  const state = {
    status: 'inactive',
    mission: MISSION.title,
    stage: 'meet-kola',
    objective: 'Find Kola at his kiosk.',
    reward: 0
  };

  function publish() {
    onChange({ ...state });
  }

  function start() {
    if (state.status !== 'inactive') return;
    state.status = 'active';
    publish();
  }

  function setStage(stage, objective) {
    if (state.status !== 'active') return;
    state.stage = stage;
    state.objective = objective;
    publish();
  }

  function complete() {
    if (state.status !== 'active') return;
    state.status = 'completed';
    state.stage = 'completed';
    state.objective = 'Mission complete. Your journey in Oriyaba has begun.';
    state.reward = MISSION.reward;
    publish();
  }

  return {
    state,
    start,
    setStage,
    complete,
    getState: () => ({ ...state })
  };
}
