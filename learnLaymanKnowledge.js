/**
 * RISKOS — Complete 80 Quantitative Laboratories Layman Knowledge Map
 * Provides distinct, beginner-friendly, zero-jargon definitions, everyday real-world analogies,
 * practical trading/investing significance, and step-by-step numerical examples for all 80 labs.
 */

const LearnLaymanKnowledge = (() => {
  const MAP = {
  cagr: {
    whatIsIt: "CAGR (Compound Annual Growth Rate) is the steady rate at which an investment would grow each year if it grew at a perfectly constant speed from start to finish.",
    analogy: "The cruise control speedometer of an airplane. Flight winds cause speeds to fluctuate wildly mid-air, but CAGR gives the single constant speed that would have flown the entire journey in the exact same elapsed time.",
    whyItMatters: "Eliminates misleading claims from investment sellers. It accounts for compounding and multi-year holding periods, giving you the true annual benchmark rate.",
    realWorldExample: "If you invest ₹1,00,000 and it grows to ₹2,00,000 over 5 years, your simple return is 100%, but your CAGR is 14.87% per year."
  },
  compounding: {
    whatIsIt: "The mathematical process where profits earned on your initial capital begin earning their own additional profits in subsequent periods.",
    analogy: "A snowball rolling down a snowy mountain slope. It starts small, but as it rolls, each layer picks up snow faster and faster until the snowball dwarfs the original handful.",
    whyItMatters: "Albert Einstein called compound interest the eighth wonder of the world. Starting just 5 years earlier can double your eventual retirement nest egg with zero extra effort.",
    realWorldExample: "Investing ₹1,00,000 at 12% annual return for 30 years grows to ₹29.96 Lakhs, where over 96% of the final wealth comes from accumulated compound interest."
  },
  sip_dca: {
    whatIsIt: "SIP (Systematic Investment Plan) or Dollar-Cost Averaging is investing a fixed sum of money into an asset on a recurring schedule (e.g. monthly), irrespective of market price.",
    analogy: "Buying groceries every Sunday. When apples are on discount, your budget buys two big bags; when prices surge, you buy fewer. Over time, your average price per apple is cheaper than the peak price.",
    whyItMatters: "Removes emotional stress and market timing anxiety. It turns market crashes into lucrative buying opportunities because you automatically accumulate more units at cheaper valuations.",
    realWorldExample: "Investing ₹10,000 every month for 15 years at an expected 12% CAGR costs ₹18 Lakhs in total deposits, but matures into a wealth corpus of ₹50.46 Lakhs."
  },
  lumpsum_sip: {
    whatIsIt: "The strategic comparison between deploying your entire capital pool at once (Lumpsum) versus spreading it over multiple installments across months (SIP).",
    analogy: "Buying a whole winter season's supply of heating oil at once in October versus buying a smaller can every weekend as temperatures drop.",
    whyItMatters: "Historically in rising equity markets, Lumpsum outperforms ~66% of the time because capital starts compounding immediately; however, SIP protects against emotional panic if a crash hits right after entry.",
    realWorldExample: "Deploying ₹12 Lakhs as a lumpsum in NIFTY 50 at 13% CAGR grows to ₹39.5 Lakhs in 10 years, whereas spreading it via monthly SIP over 10 years accumulates ~₹27.8 Lakhs."
  },
  compound_timeline: {
    whatIsIt: "A milestone timeline tracking how long it takes for compounding to double your money and cross wealth thresholds (e.g. ₹10 Lakhs, ₹50 Lakhs, ₹1 Crore).",
    analogy: "A Chinese bamboo tree that grows virtually nothing above ground for four years while building deep subterranean root systems, and then explodes 80 feet upward in just six weeks.",
    whyItMatters: "The first ₹1 Crore is notoriously difficult and may take 12-15 years of savings. The second ₹1 Crore takes just 4 to 5 years because your accumulated returns generate more cash than your salary.",
    realWorldExample: "Using the Rule of 72, at a 12% annual return your capital doubles every 6 years (72 ÷ 12). An initial ₹10 Lakhs doubles to ₹20L in year 6, ₹40L in year 12, and ₹80L in year 18."
  },
  pe_eps: {
    whatIsIt: "Earnings Per Share (EPS) is the net profit divided by the total number of shares. Price-to-Earnings (P/E) shows how many rupees investors pay for every ₹1 of annual profit.",
    analogy: "Buying a local bakery. If the bakery earns ₹10 Lakhs in annual profit and the owner wants ₹1 Crore to sell it to you, you are paying a P/E multiple of 10× (a 10-year payback period).",
    whyItMatters: "P/E tells you if an asset is cheap or overpriced. A P/E of 80 means investors expect sensational future growth (like AI tech), while a P/E of 10 indicates mature or declining businesses.",
    realWorldExample: "A stock trading at ₹2,500 with annual EPS of ₹100 has a P/E ratio of 25×. If another competitor trades at ₹1,500 with EPS of ₹100 (P/E 15×), the competitor is cheaper on earnings."
  },
  roe_roce: {
    whatIsIt: "Return on Equity (ROE) measures how much net profit management generates from shareholder funds. ROCE measures profit generated from all capital employed, including debt.",
    analogy: "Comparing two dairy cows: Cow A produces 20 liters of milk on 10 kg of feed; Cow B produces only 5 liters on the exact same 10 kg of feed. Cow A has vastly superior operational efficiency.",
    whyItMatters: "High ROE (>18%) sustained over a decade is Warren Buffett's primary indicator of a company with an insurmountable competitive moat and superior capital allocation.",
    realWorldExample: "A company with ₹500 Cr in equity that generates ₹100 Cr in net profit has an ROE of 20%. If it achieves this with zero bank debt, its ROCE will be equally strong."
  },
  volatility: {
    whatIsIt: "Annualized Volatility (Standard Deviation) measures the typical dispersion or turbulence of price swings around an asset's average return.",
    analogy: "The shock absorbers on a car traveling down an unpaved gravel road. A smooth luxury highway drive has low volatility; a jarring off-road track has high volatility.",
    whyItMatters: "Higher volatility means higher price unpredictability. High-volatility assets require smaller position sizes to prevent sudden account wipeouts during market pullbacks.",
    realWorldExample: "NIFTY 50 typically fluctuates with an annualized volatility of 14% to 16%, whereas volatile growth stocks and crypto tokens regularly exhibit 50% to 90% volatility."
  },
  beta_corr: {
    whatIsIt: "Beta measures how sensitive an individual stock's price movements are relative to the broader benchmark index (e.g. NIFTY 50 or S&P 500).",
    analogy: "A dog walking on an elastic leash beside its owner. A beta of 1.0 means the dog matches the owner's pace. A beta of 2.0 means if the owner steps forward 1 meter, the excited dog leaps forward 2 meters.",
    whyItMatters: "Allows portfolio managers to construct defensive portfolios (Beta < 0.8, like FMCG or healthcare) to withstand bear markets, or aggressive portfolios (Beta > 1.3) during bull runs.",
    realWorldExample: "If a stock has a beta of 1.5, when the NIFTY 50 rallies by 2%, the stock is statistically expected to surge by +3.0%. However, if NIFTY drops 2%, the stock will likely fall -3.0%."
  },
  mdd: {
    whatIsIt: "Maximum Drawdown (MDD) is the largest observed percentage drop from a historical peak to the subsequent lowest trough before a new high is reached.",
    analogy: "The deepest sudden elevator drop during a power outage before the emergency safety brake kicks in and the lift starts ascending back up to the roof.",
    whyItMatters: "MDD measures the true emotional pain of an investment. Most retail investors panic and liquidate their portfolios precisely at the maximum drawdown point, locking in catastrophic losses.",
    realWorldExample: "If your portfolio reaches an all-time peak of ₹10,00,000 and crashes to ₹6,00,000 during a market panic, your Maximum Drawdown is 40% (loss of ₹4,00,000)."
  },
  drawdown_recovery: {
    whatIsIt: "The mathematical asymmetry governing portfolio losses, showing that any percentage decline requires a substantially larger percentage gain just to return to breakeven.",
    analogy: "Climbing out of a deep ravine. Slipping down 10 meters is easy to climb back up. But if you fall 50 meters down a cliff, you have to climb 100% of your remaining elevation just to reach the rim.",
    whyItMatters: "A 50% loss requires a 100% gain to recover. An 80% loss requires a 400% gain. A 90% loss requires an almost impossible 900% gain! Protecting capital is 10× more vital than chasing upside.",
    realWorldExample: "If ₹1,00,000 drops 50% to ₹50,000, you need a 100% gain on that ₹50,000 just to get back your original ₹1,00,000."
  },
  sharpe: {
    whatIsIt: "Sharpe Ratio measures the risk-adjusted excess return of an investment above risk-free government bonds, divided by the total volatility endured to achieve it.",
    analogy: "Comparing two marathon runners who finish in 3 hours. Runner A ran on a flat paved track; Runner B ran through a muddy jungle carrying a 25kg backpack. Runner A has a superior efficiency ratio.",
    whyItMatters: "Anyone can generate high returns by taking reckless, unhedged leverage. The Sharpe ratio exposes whether high returns are genuine skill or just roulette wheel gambling.",
    realWorldExample: "Fund A returns 18% with 10% volatility (Sharpe = (18 - 7)/10 = 1.10). Fund B returns 22% with 25% volatility (Sharpe = (22 - 7)/25 = 0.60). Fund A is mathematically superior."
  },
  diversification: {
    whatIsIt: "Asset diversification is allocating capital across multiple non-correlated assets so that the failure of any single holding cannot sink the entire portfolio.",
    analogy: "An entrepreneur who owns both an umbrella shop and a sunscreen boutique. When it rains, umbrella sales spike; when it is blistering hot, sunscreen flies off the shelves. Total revenue stays steady year-round.",
    whyItMatters: "Nobel laureate Harry Markowitz termed diversification the only 'free lunch' in finance: you reduce risk significantly without sacrificing expected returns.",
    realWorldExample: "Holding 20 distinct stocks across banking, IT, energy, and healthcare cuts portfolio volatility by ~45% compared to holding a single stock, with near-identical long-term upside."
  },
  port_variance: {
    whatIsIt: "Markowitz Portfolio Variance calculates the total volatility of a multi-asset portfolio by factoring in the individual weights, variances, and cross-asset covariance.",
    analogy: "An orchestra. If every brass horn and bass drum plays at the exact same moment, the sound is painful noise. When instruments play complementary notes, the result is smooth harmony.",
    whyItMatters: "Combining two risky assets that are negatively correlated creates an overall portfolio that is substantially less risky than either asset individually.",
    realWorldExample: "Two assets each with 20% annual volatility but with a correlation of -0.20 combine into a 50/50 portfolio with only 12.6% overall volatility."
  },
  capm: {
    whatIsIt: "Capital Asset Pricing Model (CAPM) calculates the required theoretical return of an asset based on the risk-free rate, its beta, and the expected equity market risk premium.",
    analogy: "The price tag for performing a high-wire circus act. The acrobat demands a much larger payment if performing over open concrete (high beta) than with a safety net (low beta).",
    whyItMatters: "Determines whether an investment pays you enough extra return to justify taking on its systematic market risk. If expected return is below CAPM, the asset is overpriced.",
    realWorldExample: "With risk-free 10-year G-Sec yield at 7.0%, market return at 13.0%, and a stock beta of 1.20, CAPM required return is: 7% + 1.20 × (13% - 7%) = 14.2%."
  },
  port_allocator: {
    whatIsIt: "An optimization engine that computes the exact mathematical weights to allocate across equities, bonds, commodities, and cash to hit your target return with minimum risk.",
    analogy: "A Michelin-star chef balancing salt, acid, fat, and heat in a recipe. Too much fat ruins the dish; the perfect ratio yields a masterpiece.",
    whyItMatters: "Empirical studies prove that more than 90% of total portfolio return variation is driven by broad asset allocation, not by individual stock picking or market timing.",
    realWorldExample: "Allocating 60% NIFTY Index, 25% Sovereign Gold Bonds, and 15% Liquid Debt delivered 12.8% CAGR over 15 years while suffering less than half the crash depth of pure equities."
  },
  risk_return_scatter: {
    whatIsIt: "A visual scatter plot mapping portfolios on Risk (X-axis) versus Expected Return (Y-axis), highlighting the Markowitz Efficient Frontier curve.",
    analogy: "A performance test chart of sports cars plotting top speed against fuel consumption. The frontier curve marks the best engine tunes in existence.",
    whyItMatters: "Instantly reveals if your current portfolio is sub-optimal (sitting below the curve, meaning you are taking unnecessary risk for subpar returns).",
    realWorldExample: "Portfolios lying along the upper edge of the scatter curve offer the maximum possible return for every unit of volatility."
  },
  scenario_stress: {
    whatIsIt: "A risk simulation tool that exposes your portfolio to historical and hypothetical Black Swan shocks (e.g. 2008 Lehman collapse, 2020 COVID crash, +300bps rate spikes).",
    analogy: "A flight simulator subjecting an aircraft design to category-5 hurricane turbulence and engine failure to verify if the airframe bends or shatters.",
    whyItMatters: "Normal market models assume neat bell curves, but real financial markets experience violent fat-tailed crashes where correlations spike to 1.0 simultaneously.",
    realWorldExample: "Simulating a 2008-style crisis on an unhedged tech portfolio reveals an instantaneous projected drawdown of -44%, triggering pre-emptive hedging rules."
  },
  options_payoff: {
    whatIsIt: "The mathematical payoff profile of Call and Put option contracts at expiry, illustrating profit, loss, and breakeven boundaries across strike prices.",
    analogy: "Buying insurance for a smartphone. You pay a small non-refundable fee. If you drop the phone and shatter the screen, the insurer replaces it; if you never drop it, you only lose the fee.",
    whyItMatters: "Options allow you to define exact downside risk in advance (maximum loss limited to premium paid) while maintaining unlimited upside participation.",
    realWorldExample: "Buying a ₹2,500 Call option on Reliance for ₹60 gives unlimited profit once the price rises above ₹2,560, while your maximum loss is strictly capped at ₹60."
  },
  quant_backtest: {
    whatIsIt: "Walk-forward algorithmic simulation that replays a quantitative trading strategy on historical market data, incorporating slippage, exchange fees, and execution lag.",
    analogy: "Reviewing flight telemetry and black-box data of 500 simulated test flights before ever letting passengers board a new supersonic jet.",
    whyItMatters: "Prevents traders from burning real money on unproven strategies, confirming whether an idea has statistical edge or is just curve-fitted noise.",
    realWorldExample: "Backtesting a 200-day moving average trend strategy on NIFTY over 20 years avoids the 2008 and 2020 crashes, lifting the Sharpe ratio from 0.70 to 1.15."
  },
  ito_calculus: {
    whatIsIt: "Itô's Lemma is the fundamental calculus theorem of stochastic calculus used to find the differential of a time-dependent function of a continuous random process.",
    analogy: "Calculating the fuel efficiency of a speedboat bouncing across choppy ocean waves. Standard smooth calculus fails because the water surface is jagged, so an extra wave-energy correction term is required.",
    whyItMatters: "It powers the entire modern quantitative derivatives industry, including the Black-Scholes partial differential equation and option delta hedging.",
    realWorldExample: "Using Itô's formula, the change in option price dC accounts for the curvature (Gamma) via the term (1/2) σ² S² (∂²C/∂S²) dt."
  },
  feynman_kac: {
    whatIsIt: "The Feynman-Kac theorem establishes a bridge between parabolic partial differential equations (PDEs) and stochastic expectations via Monte Carlo simulations.",
    analogy: "A magic translation dictionary connecting two languages: solving an intricate heat diffusion equation in physics translates directly into calculating the average payout of a financial option over random paths.",
    whyItMatters: "Allows quantitative analysts to price complex multi-asset exotic derivatives using fast Monte Carlo path simulations instead of solving high-dimensional PDEs.",
    realWorldExample: "Pricing a barrier option with knocking boundaries by averaging 100,000 geometric Brownian motion paths under risk-neutral discounting."
  },
  heston_fft: {
    whatIsIt: "The Heston Stochastic Volatility model with Fast Fourier Transform (FFT) pricing, which captures the volatility smile by modeling asset volatility itself as a random mean-reverting process.",
    analogy: "A weather forecast that not only predicts temperature fluctuations, but also predicts how violently the wind gusts themselves will speed up or die down.",
    whyItMatters: "Black-Scholes assumes volatility is a flat constant. Heston reproduces the real-world 'volatility smile' observed in market option chains, preventing severe mispricing.",
    realWorldExample: "Calibrating mean-reversion speed κ and vol-of-vol σ_v to match out-of-the-money Put options during high-implied-volatility earnings seasons."
  },
  vasicek_cir: {
    whatIsIt: "Vasicek and Cox-Ingersoll-Ross (CIR) term structure models describe the stochastic evolution of interest rates with mean-reversion toward a long-term central bank target.",
    analogy: "A thermostat in a room with an open window. When a cold breeze enters, the furnace activates to pull the temperature back toward the thermostat setting.",
    whyItMatters: "Essential for pricing interest rate swaps, Treasury bond futures, and mortgage-backed securities across yield curves.",
    realWorldExample: "Modelling the 10-year Indian G-Sec yield fluctuating around a 7.00% long-term mean with mean-reversion speed a = 0.25."
  },
  avellaneda_stoikov: {
    whatIsIt: "The classical high-frequency market making model that determines optimal bid and ask quotes based on inventory risk aversion and order arrival intensity.",
    analogy: "An umbrella vendor in a marketplace who adjusts prices based on how many umbrellas remain in his cart: with 100 umbrellas left and rain ending, he discounts prices to dump stock quickly.",
    whyItMatters: "Prevents high-frequency market makers from accumulating dangerous inventory and getting run over by toxic informed flow.",
    realWorldExample: "Holding +50 contracts long causes the market maker to shift reservation price downward by q γ σ² (T - t), attracting aggressive buyers and deterring sellers."
  },
  copulas_evt: {
    whatIsIt: "Copula models and Extreme Value Theory (EVT) that model the non-linear joint dependency of asset tail crashes without assuming a standard normal Gaussian distribution.",
    analogy: "Two rock climbers tied with a safety rope. On normal hiking trails they walk independently, but if one falls off a steep cliff, the rope immediately yanks the second climber down too.",
    whyItMatters: "The 2008 crisis happened because Gaussian Copula models assumed defaults were independent. Tail copulas account for panic contagion when correlations jump to 1.0.",
    realWorldExample: "Using a Clayton Copula to model joint crash probability between banking stocks and credit spreads during sovereign liquidity freezes."
  },
  merton_jump_diffusion: {
    whatIsIt: "An extension of geometric Brownian motion that adds a compound Poisson jump process to account for sudden discontinuous market crashes and news gaps.",
    analogy: "A hiking trail along a scenic ridge that is mostly gentle, but occasionally features sudden earthquake fissures and rockslides that drop you several feet instantly.",
    whyItMatters: "Standard models cannot explain overnight gap downs or sudden flash crashes; Merton jump-diffusion matches the steep negative skew of index options.",
    realWorldExample: "Modeling sudden -15% earnings gap-downs with jump arrival rate λ = 0.8 jumps per year and mean jump size μ_J = -0.10."
  },
  almgren_chriss: {
    whatIsIt: "The institutional benchmark framework for optimal algorithmic trade execution, balancing market impact and slippage against market risk over time.",
    analogy: "Dumping a massive truckload of sand into a narrow swimming pool. Pouring it all at once causes a giant wave (high market impact); pouring one cup an hour exposes you to approaching rainstorms (inventory risk).",
    whyItMatters: "Used by Goldman Sachs, Citadel, and institutional execution desks to liquidate multi-crore positions at minimum Implementation Shortfall cost.",
    realWorldExample: "Liquidating 5,00,000 shares of Reliance over a 4-hour trading session using optimal half-life trajectory to minimize price depression."
  },
  kalman_pairs: {
    whatIsIt: "A recursive state-space Kalman Filter that continuously updates the time-varying hedge ratio β_t between two cointegrated stocks for statistical arbitrage pairs trading.",
    analogy: "A laser-guided tracking system on a speedboat chasing a dolphin. As the dolphin zigs and zags, the system continuously adjusts the steering angle in real time.",
    whyItMatters: "Static linear regression breaks down as business correlations drift. Kalman filters adapt dynamically to regime shifts, keeping pairs market-neutral.",
    realWorldExample: "Trading HDFC Bank vs ICICI Bank: when the price spread z-score deviates past ±2.0σ, enter mean-reversion trade, unwinding when z returns to 0."
  },
  black_litterman: {
    whatIsIt: "The Black-Litterman asset allocation model combines market equilibrium weights with subjective investor views and confidence levels to create stable, diversified portfolios.",
    analogy: "A courtroom jury that starts with the presumption of baseline facts, and then shifts its verdict in proportion to the credibility and certainty of each witness testimony.",
    whyItMatters: "Fixes Markowitz mean-variance optimization's notorious flaw of creating extreme, erratic 100% concentrated bets on noisy return estimates.",
    realWorldExample: "Tilting an equilibrium global index by adding a bullish view: 'Tech sector will outperform Energy by 4.5% with 70% confidence'."
  },
  perpetual_american: {
    whatIsIt: "Closed-form pricing and optimal exercise boundary determination for perpetual American options that have no expiration date.",
    analogy: "Holding a lifetime VIP pass that allows you to purchase a vintage sports car for ₹25 Lakhs whenever you choose. The optimal strategy is waiting until the car's market value exceeds a specific threshold.",
    whyItMatters: "Serves as the foundation for real options valuation in corporate capital budgeting and natural resource extraction decisions.",
    realWorldExample: "Determining the optimal stock price boundary S* = 145.2 at which an American Put option with strike ₹100 should be immediately exercised."
  },
  bachelier_model: {
    whatIsIt: "The arithmetic Brownian motion option pricing model created by Louis Bachelier in 1900, which allows for normal price dynamics and negative prices.",
    analogy: "Measuring the water level in an irrigation canal that can rise above normal or drop into negative empty basins during a severe drought.",
    whyItMatters: "When crude oil crashed to -$37.63/barrel in April 2020, Black-Scholes completely broke down because log of negative numbers is undefined; exchanges switched to Bachelier.",
    realWorldExample: "Pricing options on commodities and European sovereign interest rates that trade in negative yield environments."
  },
  prediction_markets_lmsr: {
    whatIsIt: "Robin Hanson's Logarithmic Market Scoring Rule (LMSR), an automated market maker mechanism that guarantees liquidity and bounded loss in information prediction markets.",
    analogy: "A bookmaker at an election who automatically adjusts betting odds smoothly with every single ticket sold, guaranteeing that anyone can place a bet at any second.",
    whyItMatters: "Powers modern prediction platforms (like Polymarket and Kalshi) to aggregate collective intelligence and forecast geopolitical, macroeconomic, and election outcomes.",
    realWorldExample: "A binary contract on 'RBI rate cut by December': liquidity parameter b = 1000 moves implied probability from 45% to 58% after ₹20,000 in buy orders."
  },
  futures_basis_carry: {
    whatIsIt: "Cash-and-carry futures basis arbitrage, buying spot assets and shorting futures contracts when the annualized basis yield exceeds money market borrowing costs.",
    analogy: "Buying gold coins from a jeweler today at ₹70,000 while simultaneously signing a legally binding contract to deliver them to a buyer next month for ₹71,000, pocketing the locked-in ₹1,000 difference.",
    whyItMatters: "Generates risk-free, market-neutral yields (typically 8% to 14% annualized in Indian markets) with zero exposure to stock market direction.",
    realWorldExample: "Spot NIFTY at 24,000, 1-month Future at 24,180. The 180-point premium equals an annualized basis return of 9.12%, beating bank fixed deposits."
  },
  backtrader_cerebro: {
    whatIsIt: "Event-driven quantitative backtesting architecture that executes strategy logic bar-by-bar to strictly eliminate look-ahead bias and realistic fill simulation.",
    analogy: "Watching a recorded chess grandmaster match move-by-move with a cardboard sheet hiding the future moves, forcing you to make your move with only past information.",
    whyItMatters: "Most amateur backtests look profitable because of subtle look-ahead bias (using today's closing price before the day is over). Event-driven engines eliminate this illusion.",
    realWorldExample: "Evaluating an RSI mean-reversion strategy over 1,000 trading bars with realistic 0.05% brokerage and slippage fees."
  },
  openbb_odp: {
    whatIsIt: "OpenBB Open Data Platform integration bridge, synthesizing multi-vendor market data across macroeconomic indicators, corporate balance sheets, and options chains.",
    analogy: "A universal power adapter and multi-feed television control room bringing feeds from Bloomberg, Reuters, and government treasuries onto a single command console.",
    whyItMatters: "Enables institutional-grade quantitative data pipelines without multi-million rupee proprietary terminal subscriptions.",
    realWorldExample: "Pulling real-time US 10-Year Treasury Yields, Indian CPI inflation, and sectoral EPS momentum into a single cross-asset screener."
  },
  perspective_streaming_grid: {
    whatIsIt: "High-performance WebAssembly/WebGL streaming data table capable of rendering millions of live ticks and calculating real-time pivots at 60 FPS without UI freezing.",
    analogy: "The heads-up display in a fighter jet cockpit that updates flight vectors and radar contacts at microsecond speeds without ever stuttering or blurring.",
    whyItMatters: "Institutional trading desks monitor thousands of simultaneous orders; high-throughput streaming grids ensure zero rendering lag during extreme market volatility.",
    realWorldExample: "Pivoting 100,000 active option strike orders by delta and volume at sub-16 millisecond frame render times."
  },
  rough_volatility: {
    whatIsIt: "A cutting-edge financial mathematics framework showing that log-volatility behaves like a Fractional Brownian Motion with Hurst parameter H < 0.5 (rougher than standard Brownian motion).",
    analogy: "Looking at a jagged mountain coastline under a microscope: no matter how close you zoom in, the rock edges remain violently fractured and rough, not smooth curves.",
    whyItMatters: "Explains why short-term at-the-money option volatility skews are exceptionally steep, a physical phenomenon that classical Black-Scholes cannot model.",
    realWorldExample: "Fitting rough Bergomi model with H ≈ 0.14 to replicate 0DTE short-dated options skew on expiry day."
  },
  malliavin_calculus: {
    whatIsIt: "The calculus of variations on infinite-dimensional Wiener spaces, enabling direct analytical calculation of option sensitivities (Greeks) without finite-difference re-simulation.",
    analogy: "Taking an instant X-ray of a complex engine to measure heat stress at 100 points simultaneously, instead of heating the engine 100 times and taking separate thermometers.",
    whyItMatters: "Calculates Greek sensitivities (Delta, Gamma, Vega) in a single Monte Carlo pass, slashing computer simulation time from hours to seconds.",
    realWorldExample: "Computing pathwise Delta of an Asian arithmetic option with zero finite-difference discretization noise."
  },
  hjb_stochastic_control: {
    whatIsIt: "The Hamilton-Jacobi-Bellman (HJB) partial differential equation governing dynamic optimal control of financial portfolios under stochastic market conditions.",
    analogy: "An autonomous spacecraft navigation computer that continuously computes the optimal rocket thruster burns to land on a moving asteroid with minimum fuel.",
    whyItMatters: "Solves the classical Merton optimal consumption and investment problem: how much capital an investor should consume today versus reinvest in risky assets.",
    realWorldExample: "Calculating optimal portfolio equity allocation π* = (μ - r) / (γ σ²) under constant relative risk aversion γ = 3.0."
  },
  dqn_optimal_execution: {
    whatIsIt: "Deep Q-Network (DQN) Reinforcement Learning agent that learns optimal trade slicing and limit order routing by interacting with a live simulated order book.",
    analogy: "A chess AI that plays 10 million games against itself to master when to place a passive pawn block versus when to launch an aggressive bishop attack.",
    whyItMatters: "Outperforms static execution rules (like TWAP) by adapting dynamically to order book depth, queue priority, and sudden bid-ask cancellations.",
    realWorldExample: "DQN agent reduces slippage by 3.8 basis points on a ₹10 Crore block order compared to standard volume-weighted average price schedules."
  },
  quantum_monte_carlo: {
    whatIsIt: "Quantum Amplitude Estimation algorithm that achieves quadratic speedup O(1/ε) over classical Monte Carlo O(1/ε²) for portfolio Value at Risk (VaR).",
    analogy: "Finding a hidden needle in a haystack. A normal search checks pieces one-by-one; a quantum search uses wave interference to illuminate the needle almost instantly.",
    whyItMatters: "Allows institutional banks to run real-time Basel III regulatory stress tests and multi-million-path tail risk calculations in milliseconds instead of overnight.",
    realWorldExample: "Achieving 0.01% VaR precision using 1,000 quantum oracle evaluations instead of 1,000,000 classical pseudorandom simulations."
  },
  fama_french_5factor: {
    whatIsIt: "Multi-factor asset pricing model expanding CAPM by decomposing stock returns across Market Beta, Size (SMB), Value (HML), Profitability (RMW), and Investment (CMA).",
    analogy: "Deconstructing a recipe's flavor into 5 pure spices: sweetness, salt, acid, umami, and heat. You can see exactly which spice gave the dish its taste.",
    whyItMatters: "Proves whether a fund manager's outperformance is genuine stock-picking skill (Alpha) or just cheap exposure to small-cap value factors.",
    realWorldExample: "Regressing a portfolio's 5-year returns to show that 80% of excess gains came from the Value and High-Profitability factor tilts."
  },
  deflated_sharpe: {
    whatIsIt: "Marcos López de Prado's Deflated Sharpe Ratio (DSR), which adjusts the observed Sharpe ratio downward to account for selection bias, multiple testing, and non-normal returns.",
    analogy: "Testing 1,000 different keys on a padlock until one randomly opens it. If you test 1,000 keys, success is pure statistical chance, not genius key design.",
    whyItMatters: "Over 90% of published quantitative strategies fail in real trading because backtests were cherry-picked over millions of parameter variations.",
    realWorldExample: "A backtest with apparent Sharpe of 2.1 drops to a statistically insignificant Deflated Sharpe of 0.45 when corrected for 500 trial runs."
  },
  svi_sabr_calibration: {
    whatIsIt: "Stochastic Volatility Inspired (SVI) and SABR mathematical models that fit smooth, arbitrage-free implied volatility curves across strike prices and maturities.",
    analogy: "Fitting an aerodynamic carbon-fiber spoiler onto a race car body: the curve must be perfectly smooth without any kinks or sharp edges that cause drag.",
    whyItMatters: "Prevents butterfly and calendar arbitrage in option trading books, ensuring prices adhere to no-arbitrage bounds.",
    realWorldExample: "Calibrating SVI parameters (a, b, ρ, m, σ) to live NIFTY weekly option chain with root-mean-square error below 0.15%."
  },
  hawkes_process: {
    whatIsIt: "A self-exciting point process where the occurrence of one event (e.g. an aggressive sell order) temporarily increases the probability of subsequent events.",
    analogy: "An earthquake followed by a swarm of aftershocks. The initial tectonic rupture destabilizes adjacent fault lines, triggering cascading tremors.",
    whyItMatters: "Explains how small order imbalances trigger violent flash crashes within milliseconds as automated algorithmic stop-losses trigger each other.",
    realWorldExample: "When the branching ratio η = α / β approaches 1.0, the order book enters a critical explosive state, triggering automated defensive de-risking."
  },
  yen_carry_unwind: {
    whatIsIt: "A macroeconomic simulation of the global currency carry trade, borrowing at near-zero interest rates in Japanese Yen to fund high-yielding global assets, and the shock when it unwinds.",
    analogy: "Borrowing free water from a low river to run a powerhouse turbine upstream. If the river suddenly reverses flow, the entire powerhouse floods backwards.",
    whyItMatters: "The August 2024 global market crash was triggered by a rapid 10% surge in the Yen, forcing global hedge funds to dump hundreds of billions in equities to cover loans.",
    realWorldExample: "Borrowing JPY at 0.25% to buy US Tech equities yielding 12%; a 5% sudden spike in JPY wipes out an entire year of carry profits in 48 hours."
  },
  cds_index_tranches: {
    whatIsIt: "Credit Default Swap (CDS) index pricing and tranche waterfalls (Equity, Mezzanine, Senior), allocating corporate debt default losses sequentially.",
    analogy: "A multi-tiered water fountain. Water (loan defaults) fills the bottom bowl first (equity tranche); only when the bottom bowl overflows does water spill into the upper bowls.",
    whyItMatters: "Central to understanding corporate credit risk and structured finance solvency across global banking systems.",
    realWorldExample: "The 0-3% Equity tranche absorbs the first wave of defaults, paying high double-digit yields but suffering 100% principal loss in severe recessions."
  },
  commodity_roll_yield: {
    whatIsIt: "The profit or loss generated by rolling expiring commodity futures contracts into next-month contracts, driven by Contango or Backwardation in the term structure.",
    analogy: "Renting an apartment on a 1-year lease versus month-to-month. If monthly renewals get cheaper every month, you profit; if renewals get more expensive, you suffer a constant drag.",
    whyItMatters: "Explains why crude oil or natural gas ETFs often lose money over years even when spot commodity prices stay unchanged.",
    realWorldExample: "Holding crude oil futures in Contango (next month trades at $78 vs spot $76) bleeds ~2.6% per month in negative roll yield."
  },
  yield_curve_probit: {
    whatIsIt: "An econometric Probit regression model that calculates the probability of an upcoming economic recession based on the 10-Year vs 3-Month Treasury yield curve inversion.",
    analogy: "A medical barometer measuring a patient's blood pressure. When long-term blood pressure drops below resting baseline, the statistical likelihood of an impending cardiac event surges.",
    whyItMatters: "Yield curve inversion has accurately preceded every single US economic recession over the past 60 years with virtually zero false positives.",
    realWorldExample: "When the 10Y-3M spread inverts to -120 bps, the Probit model calculates an 82% probability of a recession occurring within the next 12 months."
  },
  dark_pool_adverse_selection: {
    whatIsIt: "The risk that institutional orders placed in off-exchange dark pools execute primarily against toxic, informed institutional traders, leaving you on the losing side.",
    analogy: "Selling a used car at an anonymous private auction. If a professional mechanic eagerly buys it instantly without bargaining, you probably underpriced it severely.",
    whyItMatters: "Traders use dark pools to avoid market impact, but failing to detect adverse selection leads to post-trade price drops immediately after execution.",
    realWorldExample: "An order filled in a dark pool suffers an average 4.2 bps markout loss over the next 5 minutes as informed flow runs the price down."
  },
  kyles_lambda_microstructure: {
    whatIsIt: "Kyle's Lambda λ measures market microstructure illiquidity: the price impact caused by one unit of net order flow from informed traders.",
    analogy: "How much a wooden bridge sags under each additional ton of vehicle weight. A reinforced concrete bridge barely flexes; a frail rope bridge dips violently.",
    whyItMatters: "High lambda means the market is thin and illiquid; even modest orders will push the market price away from you.",
    realWorldExample: "A stock with λ = 0.0025 moves up by ₹2.50 for every 1,000 shares of aggressive market buy orders executed."
  },
  tsmom_volatility_targeting: {
    whatIsIt: "Time-Series Momentum (TSMOM) that goes long assets in positive 12-month trends and short assets in downtrends, with position sizing scaled inverse to 20-day volatility.",
    analogy: "Driving a sports car with an automated governor: you accelerate when the road ahead is straight and clear, but the system automatically cuts throttle when driving through dense fog.",
    whyItMatters: "Delivers positive crisis alpha during prolonged bear markets while keeping portfolio risk constant across changing market regimes.",
    realWorldExample: "Targeting 15% annualized volatility: if asset volatility doubles from 15% to 30%, the algorithm automatically halves position size from 100% to 50%."
  },
  dual_momentum_antonacci: {
    whatIsIt: "Gary Antonacci's Dual Momentum strategy, combining Relative Momentum (picking the strongest asset among peers) with Absolute Momentum (requiring the asset to outperform cash).",
    analogy: "An athletic coach who picks the fastest sprinter on the team (relative strength), but only enters the race if that sprinter is currently beating their personal best qualifying time (absolute trend).",
    whyItMatters: "Prevents holding the 'best of a bad bunch' during market crashes. If all global equities are dropping, the system parks 100% of capital into safe Treasury Bills.",
    realWorldExample: "Comparing US Equities vs Emerging Markets: US is stronger (relative win), and US 12-month return (+16%) exceeds 90-day T-Bill return (+5%), triggering 100% allocation to US Equities."
  },
  tax_loss_harvesting: {
    whatIsIt: "Strategically selling investments at an unrealized loss to offset realized capital gains taxes (STCG / LTCG), immediately reinvesting in a similar asset to maintain market exposure.",
    analogy: "Using a store discount coupon before it expires to reduce your overall shopping bill, while replacing the item with an identical alternative brand.",
    whyItMatters: "Can add 1% to 2% in annualized after-tax returns ('Tax Alpha') without changing your portfolio's underlying asset allocation.",
    realWorldExample: "Selling Stock A at a ₹1,00,000 loss offsets ₹1,00,000 of Short-Term Capital Gains from Stock B, saving ₹20,000 in direct tax payments at a 20% STCG rate."
  },
  dividend_discount_model: {
    whatIsIt: "The Gordon Growth Model (DDM) calculates the intrinsic fair value of a stock by discounting all future dividend payments back to present value using a constant dividend growth rate.",
    analogy: "Valuing an apple orchard based solely on the market value of the bushels of apples it delivers to your kitchen every single autumn forever.",
    whyItMatters: "Provides a conservative fundamental anchor for mature dividend-paying blue-chip companies (like ITC, Coca-Cola, or utilities).",
    realWorldExample: "A stock paying ₹50 dividend growing at 5% annually, with a 10% required return, has an intrinsic fair value of 50 × 1.05 / (0.10 - 0.05) = ₹1,050."
  },
  kelly_criterion_growth: {
    whatIsIt: "The Kelly Criterion is a mathematical formula that calculates the exact percentage of capital to bet on an investment to maximize long-term geometric wealth growth.",
    analogy: "An experienced poker player who bets big when holding a royal flush, bets small on marginal hands, and never bets the whole bankroll on a single coin flip.",
    whyItMatters: "Betting more than full Kelly guarantees eventual mathematical bankruptcy due to volatility drag; fractional Kelly (e.g. half-Kelly) maximizes safe wealth compounding.",
    realWorldExample: "With a 60% win rate and 1.5 payoff ratio: f* = (0.60 × 1.5 - 0.40) / 1.5 = 33.3%. Half-Kelly recommends allocating 16.7% of capital."
  },
  gex_0dte_pinning: {
    whatIsIt: "Gamma Exposure (GEX) measures the dollar value of option delta that options market makers must buy or sell for every 1% move in the underlying asset.",
    analogy: "A massive rubber band tied between the stock price and the strike price with the largest open interest. As price pulls away, market maker hedging pulls it snapping back.",
    whyItMatters: "High positive GEX compresses market volatility, pinning the index to major strikes on expiry day; negative GEX triggers violent runaway trending breakouts.",
    realWorldExample: "NIFTY trading at 24,000 on weekly expiry: large positive Call and Put open interest at 24,000 forces market makers to buy dips and sell rips, pinning the index."
  },
  hawkes_liquidity_cascades: {
    whatIsIt: "A point process modeling the clustering and mutual feedback of market orders across order books, quantifying the probability of runaway liquidity holes.",
    analogy: "A panic in a crowded theatre where one person screaming 'fire!' causes three more to shout, triggering a stampede toward the narrow exit doors.",
    whyItMatters: "High-frequency desks monitor Hawkes intensity to pull quotes pre-emptively before a cascade burns through resting liquidity.",
    realWorldExample: "When arrival intensity jumps 5× above baseline, the liquidity cascade indicator trips an autonomous de-risking circuit breaker."
  },
  lbo_debt_waterfall: {
    whatIsIt: "Private Equity Leveraged Buyout (LBO) debt waterfall, modeling debt repayment tiers (Senior Secured, Mezzanine, Subordinated) to maximize Sponsor IRR on equity.",
    analogy: "Buying a rental house with 80% bank mortgage and 20% personal savings. Rental income pays down the mortgage principal; when you sell 5 years later, you pocket all the equity upside.",
    whyItMatters: "The financial mechanics powering global private equity firms (like Blackstone and KKR) to achieve 20%+ net IRRs on buyout acquisitions.",
    realWorldExample: "Acquiring a company for ₹1,000 Cr with ₹700 Cr debt. Using 5 years of cash flows to pay debt down to ₹300 Cr multiplies initial ₹300 Cr equity into ₹1,100 Cr."
  },
  merton_structural_default: {
    whatIsIt: "The Merton KMV structural credit model treats a firm's equity as a European call option on its underlying total assets, with the debt face value acting as the strike price.",
    analogy: "A homeowner whose mortgage balance is ₹50 Lakhs. If the house value drops to ₹40 Lakhs, the homeowner's equity is worthless and walking away (defaulting) becomes mathematically rational.",
    whyItMatters: "Calculates the exact Distance-to-Default and expected default frequency (EDF) for corporate bonds and bank loans.",
    realWorldExample: "A firm with ₹1,200 Cr assets and ₹1,000 Cr debt has positive equity value; if asset volatility causes asset value to dip below ₹1,000 Cr, default occurs."
  },
  solvency_ii_evt_cat: {
    whatIsIt: "Solvency II 99.5% Value-at-Risk Solvency Capital Requirement (SCR), using Generalized Pareto Distribution (GPD) Extreme Value Theory to model catastrophic insurance tail losses.",
    analogy: "Designing a coastal seawall high enough to stop a 1-in-200 year tidal surge, ensuring the town behind it survives even once-in-two-century natural disasters.",
    whyItMatters: "The legal regulatory solvency standard for insurance companies and pension funds across the European Union and global regulators.",
    realWorldExample: "Fitting GPD tail shape ξ = 0.22 to historical insurance claims to calculate that the firm must hold ₹450 Cr in liquid capital reserves to satisfy 99.5% SCR."
  },
  redington_alm_immunization: {
    whatIsIt: "Redington's classical Asset-Liability Management (ALM) immunization, matching asset and liability present values, durations, and asset convexity to protect against interest rate shifts.",
    analogy: "A seesaw balanced perfectly in the center. Even if the ground underneath tilts (interest rates change), the balance remains completely level.",
    whyItMatters: "Protects life insurance companies and pension funds from insolvency when interest rate changes impact long-term pension liabilities differently from assets.",
    realWorldExample: "Matching a 15-year pension liability of ₹500 Cr by holding a combination of 10-year and 20-year government bonds with identical Macaulay duration of 15.0 years."
  },
  clo_tranche_waterfall: {
    whatIsIt: "Collateralized Loan Obligation (CLO) cash-flow distribution waterfall, routing interest and principal payments from leveraged loans sequentially from AAA tranches down to unrated Equity.",
    analogy: "A tier of champagne glasses at a wedding. Champagne pours into the top glass (AAA); only when it is completely full does it spill into the second glass (BBB), and finally the bottom tray (Equity).",
    whyItMatters: "The primary securitization engine funding non-investment grade corporate debt across global capital markets.",
    realWorldExample: "In a ₹1,000 Cr CLO, loan interest first pays AAA coupon (SOFR + 1.2%), then BBB coupon (SOFR + 3.5%), with remaining residual excess spread (14%+) paid to Equity."
  },
  oas_binomial_tree: {
    whatIsIt: "Option-Adjusted Spread (OAS) calculated via a short-rate binomial interest rate tree, isolating pure credit spread by stripping out embedded prepayment or call options.",
    analogy: "Pricing a house that has a built-in clause allowing the seller to buy it back in 3 years. You must deduct the financial value of that seller option to determine the true value of the house.",
    whyItMatters: "Standard yield spread is deceptive for callable corporate bonds; OAS reveals the true credit risk compensation.",
    realWorldExample: "A callable bond with nominal spread of 220 bps has an embedded call option worth 65 bps; its true Option-Adjusted Spread is 155 bps."
  },
  sector_relative_strength: {
    whatIsIt: "A quantitative sector rotation matrix ranking industry sectors (IT, Pharma, Auto, Banking, Energy) by price momentum against the benchmark to capture institutional rotation.",
    analogy: "Surfing ocean waves. When one wave peaks and loses momentum, the skilled surfer paddles over to the newly forming swell to maintain forward speed.",
    whyItMatters: "Institutional capital continuously rotates between defensive and cyclical sectors; holding top relative-strength sectors generates substantial alpha over static buy-and-hold.",
    realWorldExample: "Allocating to Auto and Banking when their 3-month RS ratio exceeds 1.05 while underweighting IT when its RS ratio drops below 0.95."
  },
  egyptian_pantheon_hft: {
    whatIsIt: "RISKOS Egyptian Pantheon Level-2 Microstructure Engine, analyzing Order Flow Imbalance (OFI) and Volume-Synchronized Probability of Toxicity (VPIN) to detect aggressive institutional sweeps.",
    analogy: "A sonar technician inside a submarine listening to water pressure waves to detect an incoming torpedo before it is visible on periscope cameras.",
    whyItMatters: "Order flow changes precede price changes. Detecting toxic order flow imbalance allows market makers to dodge adverse institutional sweeps.",
    realWorldExample: "VPIN toxicity indicator spiking above 0.75 signals high probability of an impending directional liquidity sweep, triggering wide quote spreads."
  },
  garch_jump_diffusion: {
    whatIsIt: "A hybrid econometric model combining GARCH(1,1) time-varying volatility clustering with compound Poisson jumps to capture both persistent volatility and sudden price crashes.",
    analogy: "Forecasting summer weather: mostly predictable warm afternoons with humidity clustering over consecutive days, punctuated by sudden violent lightning thunderstorms.",
    whyItMatters: "Financial asset volatility is not constant; high-volatility days cluster together, followed by occasional catastrophic overnight jumps.",
    realWorldExample: "Forecasting tomorrow's conditional volatility σ²_{t+1} = ω + α ε²_t + β σ²_t while incorporating a 3% jump risk."
  },
  cross_asset_stat_arb: {
    whatIsIt: "Statistical arbitrage engine exploiting cointegrated relationships across asset classes (e.g. Brent Crude vs Oil Marketing Companies, Gold vs INR currency).",
    analogy: "Two leashed dogs walking through a park. They may dart around trees independently, but the rigid length of the leash guarantees they can never stray far apart.",
    whyItMatters: "Generates market-neutral returns that have zero correlation to whether the overall stock market is going up or down.",
    realWorldExample: "When the price spread between Brent crude futures and ONGC stock deviates by more than 2.2 standard deviations, enter a mean-reversion pair trade."
  },
  barra_multi_factor_risk: {
    whatIsIt: "Institutional multi-factor risk model (pioneered by MSCI Barra), decomposing total portfolio risk into Systematic Factor Risk (Size, Volatility, Momentum, Quality) and Specific Asset Risk.",
    analogy: "A complete medical blood panel that checks cholesterol, hemoglobin, vitamins, and thyroid levels separately, rather than just telling you your overall body weight.",
    whyItMatters: "Institutional asset managers managing ₹10,000+ Crore must ensure returns are driven by intended alpha bets, not unintended factor risks.",
    realWorldExample: "Decomposing an active equity portfolio: 65% of risk comes from Factor exposures (high beta & momentum), 25% from Stock Specific risk, and 10% from sector tilts."
  },
  optimal_vwap_execution: {
    whatIsIt: "Algorithmic order execution model that slices large parent orders into dynamic child orders matching the historical intraday U-shaped volume curve (VWAP / TWAP).",
    analogy: "Sipping a giant milkshake through a straw at a steady pace that matches how fast the milkshake melts, rather than gulping it all in one second and getting a brain freeze.",
    whyItMatters: "Executing a ₹50 Crore block order in a single market order would crash the market by 5%; VWAP slicing executes smoothly with minimal market impact.",
    realWorldExample: "Slicing an order to execute 22% of volume in the opening 45 minutes, 8% per hour during midday lull, and 28% during the heavy market closing auction."
  },
  sabr_vol_surface: {
    whatIsIt: "The SABR (Stochastic Alpha, Beta, Rho) volatility model, which provides an analytical approximation for implied volatility smiles and skews in interest rate and FX options.",
    analogy: "A 3D topographical relief map showing mountains, valleys, and ridges across an entire mountain range, rather than a flat 2D paper map.",
    whyItMatters: "The global standard model used by interest rate trading desks to price swaptions, caps, and floors across all strikes and expiries without arbitrage.",
    realWorldExample: "Calibrating SABR parameters (α, β, ρ, ν) to fit the NIFTY option implied volatility surface with zero negative density."
  },
  reinforcement_learning_mm: {
    whatIsIt: "A Reinforcement Learning (Q-learning / PPO) autonomous market making agent trained to quote bid/ask spreads that maximize fee capture while penalizing inventory risk.",
    analogy: "An automated air traffic controller that learns through thousands of simulated airport hours how to space landings safely while minimizing passenger delay times.",
    whyItMatters: "Adapts quoting behavior dynamically to non-stationary order flows that defeat rigid static mathematical models.",
    realWorldExample: "The RL agent widens the ask spread when short inventory reaches 80% of maximum risk collar, incentivizing inbound buy flow to balance books."
  },
  evt_pot_tail_risk: {
    whatIsIt: "Extreme Value Theory (EVT) Peaks-Over-Threshold (POT) approach, fitting a Generalized Pareto Distribution (GPD) exclusively to extreme losses exceeding a high threshold.",
    analogy: "A coastal defense engineer studying only the 10 worst super-typhoon storm surges over the past century, completely ignoring gentle everyday summer waves.",
    whyItMatters: "Standard VaR drastically underestimates tail losses because normal distributions assume 6-sigma crashes happen once every 4 million years; EVT models actual fat tails.",
    realWorldExample: "Calculating 99.9% Expected Shortfall (CVaR) on a portfolio: EVT projects an extreme tail loss of ₹14.5 Lakhs vs only ₹8.2 Lakhs predicted by Gaussian models."
  },
  hmm_regime_switching: {
    whatIsIt: "A Hidden Markov Model (HMM) that infers unobservable market regimes (Bull Market, Bear Market, High-Volatility Range) directly from observable return distributions.",
    analogy: "Guessing the season outside (Winter, Monsoon, Summer) purely by looking at what kind of coats, umbrellas, or sunglasses people are wearing through a tinted window.",
    whyItMatters: "Strategies that work brilliantly in a trending bull market (like momentum) fail miserably in high-volatility ranges; HMM allows strategies to adapt their rules to the active regime.",
    realWorldExample: "Current regime classified as 'High-Volatility Bear' with 88% posterior probability, automatically triggering defensive cash rebalancing."
  },
  deep_hedging_neural_sde: {
    whatIsIt: "Deep Reinforcement Learning and Neural Stochastic Differential Equations (SDEs) that train neural networks to hedge non-linear derivatives under real-world transaction costs and liquidity friction.",
    analogy: "A self-driving racecar autopilot trained in a hyper-realistic physics simulator with tire friction, engine wear, and changing rain conditions, outperforming simple cruise control.",
    whyItMatters: "Classical Black-Scholes delta hedging assumes zero transaction costs; Neural SDE deep hedging finds the true optimal trading path that balances hedging error against real-world broker fees.",
    realWorldExample: "A 3-layer neural network rebalances an option portfolio hedge with 18% lower total hedging cost than classical Black-Scholes delta hedging."
  },
  risk_constrained_kelly: {
    whatIsIt: "A modified Kelly Criterion framework that introduces explicit maximum drawdown and Value-at-Risk constraints to eliminate the dangerous volatility of pure full-Kelly bet sizing.",
    analogy: "Driving a supercar on a racetrack with a speed governor set at 180 km/h: you still win the race comfortably, but eliminate the risk of flipping the car on sharp turns.",
    whyItMatters: "Full Kelly betting can suffer gut-wrenching 70%+ drawdowns on bad runs; risk-constrained Kelly guarantees portfolio drawdowns remain bounded within institutional risk limits.",
    realWorldExample: "Full Kelly suggests allocating 45% of capital to a high-edge trade; applying a 15% maximum drawdown constraint scales allocation safely down to 12.5%."
  },
  hayashi_yoshida_lead_lag: {
    whatIsIt: "The Hayashi-Yoshida cross-correlation estimator for asynchronous high-frequency tick data, measuring true lead-lag relationships without artificial data interpolation.",
    analogy: "Two drummers playing polyrhythms at slightly different tempos. A standard metronome fails, but an intelligent acoustic processor detects who hits the beat first.",
    whyItMatters: "In high-frequency trading, liquid futures lead cash equities by 50 to 500 milliseconds; detecting this lead-lag relationship generates predictive arbitrage alpha.",
    realWorldExample: "NIFTY Futures order flow leads spot NIFTY index changes with a peak cross-correlation coefficient of 0.68 at a lag of +120 milliseconds."
  },
  nelson_siegel_svensson: {
    whatIsIt: "The Nelson-Siegel-Svensson (NSS) 6-factor parametric model used by central banks to fit the entire sovereign yield curve from overnight rates out to 30-year bonds.",
    analogy: "A tailor fitting a bespoke suit using 6 body measurements (level, slope, short-term curvature, long-term curvature) to create a flawless fit across the entire body.",
    whyItMatters: "The official yield curve model utilized by the Reserve Bank of India, US Federal Reserve, and European Central Bank for monetary policy transmission analysis.",
    realWorldExample: "Fitting NSS parameters (β₀, β₁, β₂, β₃, τ₁, τ₂) to price Indian G-Sec bonds from 91-day T-bills up to 30-year sovereign bonds."
  },
  propagator_market_impact: {
    whatIsIt: "Jean-Philippe Bouchaud's Transient Propagator model, which models non-Markovian market impact and historical order flow memory decay in financial order books.",
    analogy: "Dropping a pebble into a pool of honey. The initial splash creates a ripple, but the viscosity of the honey slowly dampens the waves over time until the surface is flat again.",
    whyItMatters: "Proves that market impact is temporary and decays as a power-law G(t) ~ t^{-γ}; crucial for multi-day institutional block liquidation schedules.",
    realWorldExample: "Liquidating a ₹100 Crore block: power-law propagator with γ = 0.5 reveals that 60% of temporary price impact recovers within 30 minutes of order completion."
  }
};

  return MAP;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LearnLaymanKnowledge;
}
