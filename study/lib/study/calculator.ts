/**
 * A small, safe expression evaluator for the scientific calculator.
 *
 * No `eval`: the string is tokenised, turned into reverse Polish with the
 * shunting-yard algorithm, and evaluated. That keeps arbitrary code out of the
 * calculator and lets the parser be tested directly. Supported: + - * / ^, a
 * unary minus, parentheses, factorial (!), the functions sin cos tan asin acos
 * atan sqrt log ln exp abs, and the constants pi and e. Trig respects a degree
 * or radian mode.
 */

export type Angle = "deg" | "rad";

const toRad = (x: number, angle: Angle) => (angle === "deg" ? (x * Math.PI) / 180 : x);
const fromRad = (x: number, angle: Angle) => (angle === "deg" ? (x * 180) / Math.PI : x);

const FUNCTIONS: Record<string, (x: number, angle: Angle) => number> = {
  sin: (x, a) => Math.sin(toRad(x, a)),
  cos: (x, a) => Math.cos(toRad(x, a)),
  tan: (x, a) => Math.tan(toRad(x, a)),
  asin: (x, a) => fromRad(Math.asin(x), a),
  acos: (x, a) => fromRad(Math.acos(x), a),
  atan: (x, a) => fromRad(Math.atan(x), a),
  sqrt: (x) => Math.sqrt(x),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  exp: (x) => Math.exp(x),
  abs: (x) => Math.abs(x),
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: string }
  | { type: "func"; value: string }
  | { type: "lparen" }
  | { type: "rparen" };

const PRECEDENCE: Record<string, number> = { "+": 2, "-": 2, "*": 3, "/": 3, "^": 4, "u-": 5, "!": 6 };
const RIGHT_ASSOCIATIVE = new Set(["^", "u-"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const text = input.replace(/π/g, "pi").replace(/√/g, "sqrt");
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === " " || ch === "\t") {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < text.length && /[0-9.]/.test(text[i])) num += text[i++];
      if ((num.match(/\./g) ?? []).length > 1) throw new Error("Malformed number");
      tokens.push({ type: "num", value: Number(num) });
      continue;
    }
    if (/[a-z]/i.test(ch)) {
      let name = "";
      while (i < text.length && /[a-z]/i.test(text[i])) name += text[i++];
      const lower = name.toLowerCase();
      if (lower in FUNCTIONS) tokens.push({ type: "func", value: lower });
      else if (lower in CONSTANTS) tokens.push({ type: "num", value: CONSTANTS[lower] });
      else throw new Error(`Unknown name: ${name}`);
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }
    if ("+-*/^!".includes(ch)) {
      // A minus is unary when it opens the expression or follows another
      // operator or an opening paren.
      if (ch === "-") {
        const prev = tokens[tokens.length - 1];
        const unary = !prev || prev.type === "op" || prev.type === "lparen" || prev.type === "func";
        tokens.push({ type: "op", value: unary ? "u-" : "-" });
      } else {
        tokens.push({ type: "op", value: ch });
      }
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  for (const token of tokens) {
    if (token.type === "num") {
      output.push(token);
    } else if (token.type === "func") {
      stack.push(token);
    } else if (token.type === "op") {
      if (token.value === "!") {
        output.push(token); // postfix, highest precedence, applies immediately
        continue;
      }
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === "func") {
          output.push(stack.pop()!);
        } else if (top.type === "op") {
          const higher = PRECEDENCE[top.value] > PRECEDENCE[token.value];
          const equalLeft =
            PRECEDENCE[top.value] === PRECEDENCE[token.value] && !RIGHT_ASSOCIATIVE.has(token.value);
          if (higher || equalLeft) output.push(stack.pop()!);
          else break;
        } else break;
      }
      stack.push(token);
    } else if (token.type === "lparen") {
      stack.push(token);
    } else if (token.type === "rparen") {
      while (stack.length > 0 && stack[stack.length - 1].type !== "lparen") {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) throw new Error("Mismatched parentheses");
      stack.pop(); // discard the lparen
      if (stack.length > 0 && stack[stack.length - 1].type === "func") {
        output.push(stack.pop()!);
      }
    }
  }
  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top.type === "lparen") throw new Error("Mismatched parentheses");
    output.push(top);
  }
  return output;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error("Factorial needs a whole number");
  if (n > 170) return Infinity;
  let result = 1;
  for (let k = 2; k <= n; k += 1) result *= k;
  return result;
}

function evalRpn(rpn: Token[], angle: Angle): number {
  const stack: number[] = [];
  for (const token of rpn) {
    if (token.type === "num") {
      stack.push(token.value);
    } else if (token.type === "func") {
      const x = stack.pop();
      if (x === undefined) throw new Error("Missing argument");
      stack.push(FUNCTIONS[token.value](x, angle));
    } else if (token.type === "op") {
      if (token.value === "u-") {
        const x = stack.pop();
        if (x === undefined) throw new Error("Missing value");
        stack.push(-x);
      } else if (token.value === "!") {
        const x = stack.pop();
        if (x === undefined) throw new Error("Missing value");
        stack.push(factorial(x));
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error("Missing value");
        stack.push(applyBinary(token.value, a, b));
      }
    }
  }
  if (stack.length !== 1) throw new Error("Malformed expression");
  return stack[0];
}

function applyBinary(op: string, a: number, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return a / b;
    case "^": return Math.pow(a, b);
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

/**
 * Evaluate an expression, or throw. Returns a finite number or throws for
 * anything that is not (a lone divide by zero yields Infinity, which the caller
 * shows as an error rather than a result).
 */
export function evaluate(expression: string, angle: Angle = "deg"): number {
  const trimmed = expression.trim();
  if (trimmed === "") throw new Error("Nothing to work out");
  const result = evalRpn(toRpn(tokenize(trimmed)), angle);
  if (Number.isNaN(result)) throw new Error("Not a number");
  return result;
}
