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
    reward: 0,
    approach: null
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

  function chooseApproach(approach) {
    if (state.status !== 'active' || state.stage !== 'choose-approach') return;
    state.approach = approach;
    if (approach === 'run') {
      setStage('escape', 'Get away from the two men.');
      return;
    }
    if (approach === 'fight') {
      setStage('fight', 'Stand your ground and get past the two men.');
      return;
    }
    setStage('talk', 'Speak to the two men.');
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
    chooseApproach,
    complete,
    getState: () => ({ ...state })
  };
}
