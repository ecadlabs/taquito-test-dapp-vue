/**
 * Sapling Contract Definitions These contracts support Sapling protocol
 * operations for private transactions
 */

/**
 * Single sapling state contract (memo size 8) Accepts a list of sapling
 * transactions and verifies them
 */
export function singleSaplingStateContract(memoSize: number = 8): string {
  return `storage (unit);
parameter (list (sapling_transaction ${memoSize}));
code { 
  UNPAIR ;
  SAPLING_EMPTY_STATE ${memoSize};
  SWAP ;
  ITER { 
    SAPLING_VERIFY_UPDATE ;
    ASSERT_SOME ;
    CDR ; CDR ;
  } ;
  DROP ;
  NIL operation;
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
