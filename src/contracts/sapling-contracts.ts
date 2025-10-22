/**
 * Sapling Contract Definitions
 *
 * These contracts support Sapling protocol operations for private transactions.
 * Note: Sapling operations (SAPLING_EMPTY_STATE, SAPLING_VERIFY_UPDATE) are
 * low-level Michelson instructions without JSLigo equivalents, so these
 * contracts are kept in Michelson rather than being placed in
 * src/contracts/uncompiled.
 */

/**
 * Single sapling state contract with memo size 8 Accepts a list of sapling
 * transactions and verifies them
 *
 * Note: Memo size is hardcoded to 8 to prevent mismatches between contract and
 * client-side operations. If you need a different memo size, create a new
 * contract.
 */
export function singleSaplingStateContract(): string {
  const memoSize = 8;
  // Sapling shielded tez contract based on Tezos protocol reference implementation
  // See: https://gitlab.com/tezos/tezos/-/tree/master/tests_python/contracts_*
  return `parameter (list (pair (sapling_transaction ${memoSize}) (option key_hash)));
storage (sapling_state ${memoSize});
code {
  UNPAIR;
  SWAP;
  NIL operation;
  SWAP;
  ITER {
    UNPAIR;
    SWAP;
    DIP { SWAP };
    SAPLING_VERIFY_UPDATE;
    IF_NONE
      { PUSH string "Invalid sapling transaction"; FAILWITH }
      {
        UNPAIR @new_state @balance;
        DUP @balance;
        ABS;
        DIP {
          IF_LEFT
            { DROP; PUSH mutez 0 }
            {
              IF_NONE
                { PUSH string "Unshield without recipient"; FAILWITH }
                { IMPLICIT_ACCOUNT; PUSH mutez 0; SWAP; CONTRACT unit; ASSERT_SOME };
            };
        };
        DUP @balance;
        EQ;
        IF
          { DROP; DROP }
          {
            DUP @balance;
            GT;
            IF
              { SWAP; UNIT; TRANSFER_TOKENS; DIP { SWAP }; CONS }
              { AMOUNT; SWAP; NEG; DIP { PUSH mutez 0 }; SUB; ASSERT_CMPEQ };
          };
        SWAP;
      };
  };
  SWAP;
  PAIR;
}`;
}

/**
 * Multiple sapling states contract (memo size 8) Has two independent sapling
 * pools: "left" and "right"
 */
export const saplingContractDouble = `storage (pair (sapling_state :left 8) (sapling_state :right 8));
parameter (pair bool (pair (sapling_transaction :left 8) (sapling_transaction :right 8)));
code { 
  UNPAIR ;
  UNPAIR ;
  DIP {UNPAIR} ;
  DIIIP {UNPAIR} ;
  DIIP {SWAP} ;
  IF { 
    SAPLING_VERIFY_UPDATE ;
    ASSERT_SOME ;
    CDR ; CDR ;
    DIP {
      DIP {DUP};
      SAPLING_VERIFY_UPDATE;
      ASSERT_SOME ;
      DROP;
    };
  }
  { 
    DIP { DUP};
    SAPLING_VERIFY_UPDATE;
    ASSERT_SOME;
    DROP ;
    DIP { 
      SAPLING_VERIFY_UPDATE ;
      ASSERT_SOME ;
      CDR ; CDR;
    }
  };
  PAIR;
  NIL operation;
  PAIR;
}`;
