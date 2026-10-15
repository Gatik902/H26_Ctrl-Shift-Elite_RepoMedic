import pytest
from calc import add, subtract, multiply, divide, validate_positive

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_subtract():
    assert subtract(10, 4) == 6

def test_multiply():
    assert multiply(3, 4) == 12

def test_divide_valid():
    assert divide(10, 2) == 5.0

def test_divide_zero_guard():
    """
    This test verifies that divide handles 0 gracefully with ValueError.
    Currently FAILS because calc.py does a naked a / b causing ZeroDivisionError!
    """
    with pytest.raises(ValueError):
        divide(10, 0)
