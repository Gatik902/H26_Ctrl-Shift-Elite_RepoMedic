import pytest
from calc import divide_numbers

def test_divide_valid():
    assert divide_numbers(10, 2) == 5

def test_deliberate_failing_case():
    # Deliberate failure: 10 / 2 is 5, asserting 999
    assert divide_numbers(10, 2) == 999
