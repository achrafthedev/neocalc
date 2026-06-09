/**
 * Safe Mathematical Expression Parser and Evaluator
 * Implementation of Shunting-Yard Algorithm for parsing infix mathematical expressions.
 */

const precedence = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '%': 2,
  '^': 3,
  'u-': 4, // Unary minus
  'u+': 4  // Unary plus
};

const associativity = {
  '+': 'LEFT',
  '-': 'LEFT',
  '*': 'LEFT',
  '/': 'LEFT',
  '%': 'LEFT',
  '^': 'RIGHT',
  'u-': 'RIGHT',
  'u+': 'RIGHT'
};

const tokenize = (str) => {
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    let char = str[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (including integers and floating points)
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let hasDot = false;
      while (i < str.length && /[0-9.]/.test(str[i])) {
        if (str[i] === '.') {
          if (hasDot) break; // Double decimal points invalid
          hasDot = true;
        }
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Constants (π, e) and trigonometric/math functions
    if (/[a-zA-Zπ]/.test(char)) {
      let word = '';
      while (i < str.length && /[a-zA-Zπ]/.test(str[i])) {
        word += str[i];
        i++;
      }

      if (word === 'π' || word === 'pi' || word === 'PI') {
        tokens.push({ type: 'NUMBER', value: Math.PI });
      } else if (word === 'e') {
        tokens.push({ type: 'NUMBER', value: Math.E });
      } else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'].includes(word.toLowerCase())) {
        tokens.push({ type: 'FUNCTION', value: word.toLowerCase() });
      } else {
        throw new Error(`Unknown identifier: ${word}`);
      }
      continue;
    }

    // Operators and Parentheses
    if (['+', '-', '*', '/', '^', '%', '(', ')'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
};

// Insert implicit multiplication e.g. 2(3+4) -> 2*(3+4), 3π -> 3*π
const insertImplicitMultiplication = (tokens) => {
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    result.push(current);

    if (i < tokens.length - 1) {
      const next = tokens[i + 1];

      const isCurrentOperandLike =
        current.type === 'NUMBER' ||
        current.value === ')';

      const isNextOperandLike =
        (next.type === 'NUMBER' && (next.value === Math.PI || next.value === Math.E)) ||
        next.type === 'FUNCTION' ||
        next.value === '(';

      if (isCurrentOperandLike && isNextOperandLike) {
        result.push({ type: 'OPERATOR', value: '*' });
      }

      if (current.value === ')' && next.type === 'NUMBER') {
        result.push({ type: 'OPERATOR', value: '*' });
      }
    }
  }
  return result;
};

// Identify and transform unary operators
const processTokens = (rawTokens) => {
  const tokens = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (token.type === 'OPERATOR' && (token.value === '-' || token.value === '+')) {
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || (prev.type === 'OPERATOR' && prev.value !== ')') || prev.value === '(' || prev.type === 'FUNCTION';
      if (isUnary) {
        tokens.push({ type: 'UNARY_OPERATOR', value: token.value === '-' ? 'u-' : 'u+' });
        continue;
      }
    }
    tokens.push(token);
  }
  return tokens;
};

// Infix to Postfix (Shunting-Yard)
const shuntingYard = (tokens) => {
  const outputQueue = [];
  const operatorStack = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'FUNCTION') {
      operatorStack.push(token);
    } else if (token.type === 'OPERATOR' || token.type === 'UNARY_OPERATOR') {
      let top = operatorStack[operatorStack.length - 1];
      while (
        top &&
        (top.type === 'OPERATOR' || top.type === 'UNARY_OPERATOR' || top.type === 'FUNCTION') &&
        (top.type === 'FUNCTION' ||
          precedence[top.value] > precedence[token.value] ||
          (precedence[top.value] === precedence[token.value] && associativity[token.value] === 'LEFT'))
      ) {
        outputQueue.push(operatorStack.pop());
        top = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(token);
    } else if (token.value === '(') {
      operatorStack.push(token);
    } else if (token.value === ')') {
      let top = operatorStack[operatorStack.length - 1];
      while (top && top.value !== '(') {
        outputQueue.push(operatorStack.pop());
        top = operatorStack[operatorStack.length - 1];
      }
      if (!top) {
        throw new Error('Mismatched parentheses');
      }
      operatorStack.pop(); // Pop '('

      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
        outputQueue.push(operatorStack.pop());
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op.value === '(' || op.value === ')') {
      throw new Error('Mismatched parentheses');
    }
    outputQueue.push(op);
  }

  return outputQueue;
};

// Evaluate Postfix expression
const evaluatePostfix = (postfix) => {
  const stack = [];

  for (const token of postfix) {
    if (token.type === 'NUMBER') {
      stack.push(token.value);
    } else if (token.type === 'UNARY_OPERATOR') {
      if (stack.length < 1) throw new Error('Invalid expression structure');
      const val = stack.pop();
      if (token.value === 'u-' && typeof val === 'number') {
        stack.push(-val);
      } else {
        stack.push(val);
      }
    } else if (token.type === 'OPERATOR') {
      if (stack.length < 2) throw new Error('Binary operation missing arguments');
      const b = stack.pop();
      const a = stack.pop();
      switch (token.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/':
          if (b === 0) throw new Error('Division by zero');
          stack.push(a / b);
          break;
        case '%': stack.push(a % b); break;
        case '^': stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Invalid operator: ${token.value}`);
      }
    } else if (token.type === 'FUNCTION') {
      if (stack.length < 1) throw new Error('Function missing arguments');
      const val = stack.pop();
      switch (token.value) {
        case 'sin': stack.push(Math.sin(val)); break;
        case 'cos': stack.push(Math.cos(val)); break;
        case 'tan': stack.push(Math.tan(val)); break;
        case 'log':
          if (val <= 0) throw new Error('Logarithm domain error');
          stack.push(Math.log10(val));
          break;
        case 'ln':
          if (val <= 0) throw new Error('Natural log domain error');
          stack.push(Math.log(val));
          break;
        case 'sqrt':
          if (val < 0) throw new Error('Square root domain error');
          stack.push(Math.sqrt(val));
          break;
        case 'abs': stack.push(Math.abs(val)); break;
        default: throw new Error(`Invalid function: ${token.value}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Malformed evaluation stack');
  }

  const finalResult = stack[0];
  if (typeof finalResult === 'number' && !isNaN(finalResult) && isFinite(finalResult)) {
    // Avoid IEEE 754 precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
    // Round to 12 decimal places
    const rounded = Math.round(finalResult * 1e12) / 1e12;
    if (Math.abs(rounded - finalResult) < 1e-11) {
      return rounded;
    }
  }
  return finalResult;
};

/**
 * Main function to evaluate mathematical expressions safely.
 * @param {string} expression - The math expression input.
 * @returns {string} The evaluation result or "Error".
 */
export const evaluateExpression = (expression) => {
  if (!expression || expression.trim() === '') return '';
  try {
    // Normalize string representation
    let cleaned = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/mod/g, '%')
      .replace(/π/g, 'π');

    const raw = tokenize(cleaned);
    const withImplicit = insertImplicitMultiplication(raw);
    const withUnary = processTokens(withImplicit);
    const postfix = shuntingYard(withUnary);
    const result = evaluatePostfix(postfix);

    if (isNaN(result) || !isFinite(result)) {
      return 'Error';
    }
    return result.toString();
  } catch (error) {
    console.error('Parser error:', error);
    return 'Error';
  }
};
