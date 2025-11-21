from typing import List, Dict

def simplify_debts(balances: Dict[str, float]) -> List[Dict[str, any]]:
    """
    Simplify debts using greedy algorithm.
    Input: {user_id: balance} where positive means owes, negative means is owed
    Output: List of {from: user_id, to: user_id, amount: float}
    """
    # Separate creditors and debtors
    creditors = []  # People who are owed money
    debtors = []    # People who owe money
    
    for user_id, balance in balances.items():
        if balance > 0.01:  # Is owed
            creditors.append({"user_id": user_id, "amount": balance})
        elif balance < -0.01:  # Owes
            debtors.append({"user_id": user_id, "amount": -balance})
    
    # Sort to optimize
    creditors.sort(key=lambda x: x["amount"], reverse=True)
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    
    transactions = []
    i, j = 0, 0
    
    while i < len(creditors) and j < len(debtors):
        creditor = creditors[i]
        debtor = debtors[j]
        
        amount = min(creditor["amount"], debtor["amount"])
        
        transactions.append({
            "from": debtor["user_id"],
            "to": creditor["user_id"],
            "amount": round(amount, 2)
        })
        
        creditor["amount"] -= amount
        debtor["amount"] -= amount
        
        if creditor["amount"] < 0.01:
            i += 1
        if debtor["amount"] < 0.01:
            j += 1
    
    return transactions
