# QUANTUMSHIELD STATISTICAL DETECTION SPECIFICATION

## 1. Exact Binomial Hypothesis Testing
Under the null hypothesis $H_0$ (honest noisy transmission), each qubit measurement has independent mismatch probability $p_0$. The total mismatch count $X$ in $n$ verified qubits follows:
$$X \sim \text{Binomial}(n, p_0)$$

The exact upper-tail $p$-value for observing $k$ or more mismatches is given by:
$$P(X \ge k \mid n, p_0) = \sum_{j=k}^n \binom{n}{j} p_0^j (1 - p_0)^{n - j} = I_{p_0}(k, n - k + 1)$$
where $I_x(a, b)$ is the regularized incomplete beta function.

### Lentz's Continued Fraction Formulation
$$I_x(a, b) = \frac{x^a (1-x)^b}{a \, B(a, b)} \cdot \left[ \frac{1}{1 + \frac{d_1}{1 + \frac{d_2}{1 + \dots}}} \right]$$
with coefficients:
$$d_{2m} = \frac{m(b - m)x}{(a + 2m - 1)(a + 2m)}, \quad d_{2m+1} = -\frac{(a + m)(a + b + m)x}{(a + 2m)(a + 2m + 1)}$$
Symmetry transformation $I_x(a, b) = 1 - I_{1-x}(b, a)$ is applied whenever $x > \frac{a+1}{a+b+2}$.

---

## 2. Rejection Threshold Determination
The critical rejection threshold $t$ is the smallest integer such that:
$$P(X \ge t \mid n, p_0) \le \alpha$$
Evaluated in $O(\log n)$ iterations via binary search.

---

## 3. Wald's Sequential Probability Ratio Test (SPRT)
Hypotheses:
- $H_0: p = p_0$
- $H_1: p = p_1 = p_0 + \Delta$

Log-likelihood ratio bounds:
$$A = \ln\left(\frac{1 - \beta}{\alpha}\right), \quad B = \ln\left(\frac{\beta}{1 - \alpha}\right)$$

Sequential update for bit $x_i \in \{0, 1\}$ (1 = mismatch, 0 = match):
$$\Lambda_m = \sum_{i=1}^m \left[ x_i \ln\left(\frac{p_1}{p_0}\right) + (1 - x_i)\ln\left(\frac{1 - p_1}{1 - p_0}\right) \right]$$
- If $\Lambda_m \ge A \implies \text{REJECT}$ ($H_1$ favored)
- If $\Lambda_m \le B \implies \text{ACCEPT}$ ($H_0$ favored)
- Otherwise continue until $m = n_{\max}$.

---

## 4. Wilson Score Confidence Interval (95%)
$$\hat{p} = \frac{k}{n}, \quad z = 1.95996$$
$$\text{CI}_{95\%} = \frac{\hat{p} + \frac{z^2}{2n} \pm z \sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
