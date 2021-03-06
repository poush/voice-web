import { Dispatch } from 'redux';
import { UserClient } from 'common/user-clients';
import { generateGUID } from '../utility';
import StateTree from './tree';

export namespace User {
  export interface State {
    userId: string;
    email: string;
    sendEmails: boolean;
    hasDownloaded: false;
    privacyAgreed: boolean;
    recordTally: number;
    validateTally: number;

    userClients: UserClient[];
    isFetchingAccount: boolean;
    account: UserClient;
  }

  function getDefaultState(): State {
    return {
      userId: generateGUID(),
      email: null,
      sendEmails: false,
      hasDownloaded: false,
      privacyAgreed: false,
      recordTally: 0,
      validateTally: 0,

      userClients: [],
      isFetchingAccount: true,
      account: null,
    };
  }

  enum ActionType {
    UPDATE = 'UPDATE_USER',
    TALLY_RECORDING = 'TALLY_RECORDING',
    TALLY_VERIFICATION = 'TALLY_VERIFICATION',
  }

  interface UpdateAction {
    type: ActionType.UPDATE;
    state: Partial<State>;
  }

  interface TallyRecordingAction {
    type: ActionType.TALLY_RECORDING;
  }

  interface TallyVerificationAction {
    type: ActionType.TALLY_VERIFICATION;
  }

  export type Action =
    | UpdateAction
    | TallyRecordingAction
    | TallyVerificationAction;

  export const actions = {
    update: (state: Partial<State>): UpdateAction => ({
      type: ActionType.UPDATE,
      state,
    }),

    tallyRecording: (): TallyRecordingAction => ({
      type: ActionType.TALLY_RECORDING,
    }),

    tallyVerification: (): TallyVerificationAction => ({
      type: ActionType.TALLY_VERIFICATION,
    }),

    refresh: () => async (
      dispatch: Dispatch<UpdateAction>,
      getState: () => StateTree
    ) => {
      const { api } = getState();
      dispatch({
        type: ActionType.UPDATE,
        state: { isFetchingAccount: true },
      });
      const [account, userClients] = await Promise.all([
        api.fetchAccount(),
        api.fetchUserClients(),
      ]);
      dispatch({
        type: ActionType.UPDATE,
        state: { account, userClients, isFetchingAccount: false },
      });
    },

    saveAccount: (data: UserClient) => async (
      dispatch: Dispatch<UpdateAction>,
      getState: () => StateTree
    ) => {
      const { api } = getState();
      dispatch({
        type: ActionType.UPDATE,
        state: { isFetchingAccount: true },
      });
      dispatch({
        type: ActionType.UPDATE,
        state: {
          account: await api.saveAccount(data),
          isFetchingAccount: false,
        },
      });
    },
  };

  export function reducer(state = getDefaultState(), action: Action): State {
    switch (action.type) {
      case ActionType.UPDATE:
        return { ...state, ...action.state };

      case ActionType.TALLY_RECORDING:
        return { ...state, recordTally: state.recordTally + 1 };

      case ActionType.TALLY_VERIFICATION:
        return { ...state, validateTally: state.validateTally + 1 };

      default:
        return state;
    }
  }
}
