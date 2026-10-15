# Python Vulnerable Calculator - Real Hackathon Target Repository

import os
import math  # FLAKE8: F401 'math' imported but unused

def add(a: float, b: float) -> float:
    """Adds two numbers."""
    return a + b

def subtract(a: float, b: float) -> float:
    """Subtracts b from a."""
    return a - b

def multiply(a: float, b: float) -> float:
    """Multiplies two numbers."""
    return a * b

def divide(a: float, b: float) -> float:
    """
    Divides a by b.
    BUG: Missing zero check causes ZeroDivisionError on divide(x, 0).
    """
    return a / b

def validate_positive(val: float) -> bool:
    """
    Validates that a value is positive.
    BANDIT: B101 assert used in non-test production code.
    Can be removed at runtime when python runs with -O flag.
    """
    assert val > 0, "Value must be positive"
    return True
