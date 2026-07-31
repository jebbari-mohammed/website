/**
 * Glossary Generator — Creates SEO-optimized glossary pages for fitness terms.
 * Each term becomes its own page: /glossary/progressive-overload, /glossary/tdee, etc.
 * These pages rank extremely well for "what is [term]" searches and get cited by AI.
 * Run once to generate all pages, then add to sitemap.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const GLOSSARY_DIR = path.join(PUBLIC_DIR, 'glossary');

const TERMS = [
  { term: "Progressive Overload", slug: "progressive-overload", definition: "The gradual increase of stress placed on the body during exercise training. This is the #1 principle behind muscle growth — you must consistently increase weight, reps, or volume over time to force adaptation.", related: ["1rm", "hypertrophy", "periodization"] },
  { term: "1RM (One Rep Max)", slug: "1rm", definition: "The maximum amount of weight you can lift for a single repetition with proper form. It's used to calculate training percentages and track strength progress. The Epley formula estimates it: 1RM = Weight × (1 + Reps/30).", related: ["progressive-overload", "epley-formula", "strength-training"] },
  { term: "TDEE", slug: "tdee", definition: "Total Daily Energy Expenditure — the total number of calories your body burns per day including your BMR, physical activity, and the thermic effect of food. Your TDEE determines whether you gain, lose, or maintain weight.", related: ["bmr", "calorie-deficit", "macros"] },
  { term: "BMR (Basal Metabolic Rate)", slug: "bmr", definition: "The number of calories your body burns at complete rest just to keep you alive — breathing, heartbeat, brain function. BMR typically accounts for 60-70% of your TDEE.", related: ["tdee", "calorie-deficit", "metabolism"] },
  { term: "Hypertrophy", slug: "hypertrophy", definition: "The increase in muscle cell size as a response to resistance training. Typically achieved through training in the 6-12 rep range with moderate to heavy loads and adequate protein intake.", related: ["progressive-overload", "rep-ranges", "muscle-protein-synthesis"] },
  { term: "Calorie Deficit", slug: "calorie-deficit", definition: "Consuming fewer calories than your body burns (TDEE), forcing it to use stored energy (fat) for fuel. A deficit of 500 calories/day results in approximately 0.5kg of fat loss per week.", related: ["tdee", "fat-loss", "reverse-dieting"] },
  { term: "Macros (Macronutrients)", slug: "macros", definition: "The three main nutrients your body needs in large amounts: protein (4 cal/g), carbohydrates (4 cal/g), and fat (9 cal/g). Tracking macros gives you more control than just counting total calories.", related: ["protein", "tdee", "calorie-deficit"] },
  { term: "Protein Synthesis", slug: "muscle-protein-synthesis", definition: "The biological process where your body builds new muscle protein to repair and grow muscle fibers damaged during training. It's elevated for 24-48 hours after a workout, which is why protein timing and distribution matter.", related: ["protein", "hypertrophy", "recovery"] },
  { term: "Compound Exercises", slug: "compound-exercises", definition: "Exercises that work multiple muscle groups and joints simultaneously — like squats, deadlifts, bench press, and pull-ups. They're more time-efficient and trigger greater hormonal responses than isolation exercises.", related: ["isolation-exercises", "strength-training", "progressive-overload"] },
  { term: "Isolation Exercises", slug: "isolation-exercises", definition: "Exercises that target a single muscle group through one joint — like bicep curls, leg extensions, and lateral raises. They're used to bring up lagging muscle groups after compound movements.", related: ["compound-exercises", "hypertrophy", "rep-ranges"] },
  { term: "Rep Ranges", slug: "rep-ranges", definition: "The number of repetitions performed in a set, which determines the primary training adaptation: 1-5 reps for strength, 6-12 reps for hypertrophy (muscle size), and 12-20+ reps for muscular endurance.", related: ["hypertrophy", "progressive-overload", "1rm"] },
  { term: "Deload Week", slug: "deload", definition: "A planned week of reduced training volume and/or intensity (typically 40-60% reduction) to allow your body to fully recover and prevent overtraining. Usually programmed every 4-8 weeks.", related: ["periodization", "overtraining", "recovery"] },
  { term: "Periodization", slug: "periodization", definition: "The systematic planning of training into phases (mesocycles) that vary volume, intensity, and exercise selection over time to maximize long-term progress and prevent plateaus.", related: ["progressive-overload", "deload", "training-volume"] },
  { term: "Training Volume", slug: "training-volume", definition: "The total amount of work performed — calculated as sets × reps × weight. Research shows 10-20 hard sets per muscle group per week is optimal for most people.", related: ["progressive-overload", "hypertrophy", "periodization"] },
  { term: "Mind-Muscle Connection", slug: "mind-muscle-connection", definition: "The conscious focus on contracting and feeling a specific muscle during an exercise. Research shows it can increase muscle activation by up to 20%, especially for isolation movements.", related: ["hypertrophy", "isolation-exercises", "rep-ranges"] },
  { term: "DOMS (Delayed Onset Muscle Soreness)", slug: "doms", definition: "The muscle pain and stiffness that appears 24-72 hours after intense or unfamiliar exercise. It's caused by micro-tears in muscle fibers and is NOT a reliable indicator of workout quality.", related: ["recovery", "overtraining", "muscle-protein-synthesis"] },
  { term: "Overtraining Syndrome", slug: "overtraining", definition: "A condition where excessive training without adequate recovery leads to decreased performance, chronic fatigue, mood changes, and increased injury risk. Prevention requires proper sleep, nutrition, and deload weeks.", related: ["deload", "recovery", "training-volume"] },
  { term: "Body Recomposition", slug: "body-recomposition", definition: "The process of simultaneously losing fat and building muscle. It's most effective for beginners, people returning after a break, or those with higher body fat percentages. Requires eating at maintenance calories with high protein.", related: ["calorie-deficit", "protein", "hypertrophy"] },
  { term: "Reverse Dieting", slug: "reverse-dieting", definition: "The strategic, gradual increase of calories (50-100 cal/week) after a cutting phase to restore metabolic rate while minimizing fat regain. It helps prevent the rapid weight rebound that occurs after aggressive diets.", related: ["calorie-deficit", "tdee", "metabolism"] },
  { term: "Metabolic Adaptation", slug: "metabolism", definition: "Your body's natural response to prolonged calorie restriction — it becomes more efficient and burns fewer calories. This is why weight loss stalls and why reverse dieting and diet breaks are important strategies.", related: ["reverse-dieting", "tdee", "calorie-deficit"] },
  { term: "Epley Formula", slug: "epley-formula", definition: "A mathematical formula used to estimate your one-rep max: 1RM = Weight × (1 + Reps/30). It's the industry standard used by apps like IZEM to track strength progress without dangerous maximal testing.", related: ["1rm", "progressive-overload", "strength-training"] },
  { term: "Strength Training", slug: "strength-training", definition: "Any exercise that uses resistance to build muscular strength, size, and endurance. Includes free weights, machines, bodyweight exercises, and resistance bands. The foundation of any effective fitness program.", related: ["progressive-overload", "compound-exercises", "hypertrophy"] },
  { term: "Recovery", slug: "recovery", definition: "The process of rest, nutrition, and sleep that allows your body to repair muscle damage and adapt to training stress. Muscle growth happens during recovery, not during the workout itself.", related: ["doms", "deload", "overtraining"] },
  { term: "Fat Loss", slug: "fat-loss", definition: "The reduction of body fat through a sustained calorie deficit combined with resistance training and adequate protein intake. Differs from 'weight loss' because the goal is preserving muscle while losing only fat.", related: ["calorie-deficit", "body-recomposition", "tdee"] },
  { term: "Protein", slug: "protein", definition: "An essential macronutrient made of amino acids that builds and repairs muscle tissue. For muscle building, research recommends 1.6-2.2g per kg of bodyweight daily, spread across 3-5 meals.", related: ["macros", "muscle-protein-synthesis", "protein"] },
  { term: "Superset", slug: "superset", definition: "Performing two exercises back-to-back with no rest in between. Can target the same muscle (compound set) or opposing muscles (antagonist superset). Increases workout efficiency and metabolic demand.", related: ["training-volume", "hypertrophy", "compound-exercises"] },
  { term: "Drop Set", slug: "drop-set", definition: "A technique where you perform a set to failure, immediately reduce the weight by 20-30%, and continue for more reps. Effective for pushing muscles past their normal fatigue point and stimulating additional growth.", related: ["hypertrophy", "training-volume", "progressive-overload"] },
  { term: "RPE (Rate of Perceived Exertion)", slug: "rpe", definition: "A self-reported scale (typically 1-10) measuring how hard a set felt. RPE 7 = could do 3 more reps, RPE 8 = 2 more, RPE 9 = 1 more, RPE 10 = failure. Used to auto-regulate training intensity.", related: ["progressive-overload", "1rm", "training-volume"] },
  { term: "Time Under Tension", slug: "time-under-tension", definition: "The total duration a muscle is under strain during a set. Slowing down the eccentric (lowering) phase to 3-4 seconds can increase muscle activation and hypertrophy stimulus.", related: ["hypertrophy", "rep-ranges", "mind-muscle-connection"] },
  { term: "Intermittent Fasting", slug: "intermittent-fasting", definition: "An eating pattern that cycles between periods of eating and fasting. The most popular protocol is 16:8 (16 hours fasting, 8 hours eating). It's a tool for calorie control, not magic — the deficit still matters.", related: ["calorie-deficit", "fat-loss", "tdee"] },
];

const GLOSSARY_DETAILS = {
  "progressive-overload": {
    explanation: "Progressive overload is the foundation of physical training. By systematically increasing the stress placed on your body during exercise over time, you force your musculoskeletal and nervous systems to adapt, repair, and grow stronger. Without progressive overload, the body has no physiological reason to build and maintain energy-expensive muscle tissue.",
    practical: "To apply progressive overload, focus on small weekly progressions. This could mean adding 1kg to your lift, performing one additional repetition with the same weight, or completing your sets with better control and range of motion. Track sets, reps, and load closely.",
    mistakes: "The most common mistake is ego lifting—adding weight too quickly at the expense of strict form. This shifts tension off the target muscles and onto joints, leading to injury and training plateaus."
  },
  "1rm": {
    explanation: "One Rep Max (1RM) is the maximum weight you can lift for a single repetition with proper form. It is the gold-standard metric for measuring absolute strength and serves as the baseline for structural percentage-based strength training programs.",
    practical: "Instead of testing your max to failure (which is high risk), calculate it safely. A common rule is that a weight you can lift for 5 clean reps is roughly 85% of your 1RM. You can calculate the estimate using equations like the Epley formula.",
    mistakes: "Frequently testing your true 1RM is dangerous and highly fatiguing for your central nervous system, which can stall your regular training progress for days."
  },
  "tdee": {
    explanation: "Total Daily Energy Expenditure (TDEE) is the total number of calories your body burns in a 24-hour period. It is composed of your BMR (Basal Metabolic Rate), exercise activity, non-exercise movement (NEAT), and the thermic effect of food digestion.",
    practical: "Your TDEE is the target you must compare your daily intake against. Eat below your TDEE to lose fat (deficit), eat above it to gain muscle (surplus), or eat at your TDEE to maintain weight.",
    mistakes: "Using generic online calculators without adjusting for actual daily step count and workout consistency, which often leads to overestimating your actual energy expenditure."
  },
  "bmr": {
    explanation: "Basal Metabolic Rate (BMR) is the caloric cost of keeping your body alive at complete rest. It covers involuntary functions like breathing, circulating blood, cellular repair, temperature regulation, and brain activity.",
    practical: "Your BMR represents the floor of your energy needs. Aggressive diets should rarely drop below your BMR, as doing so can trigger severe metabolic downregulation, muscle loss, and chronic fatigue.",
    mistakes: "Confusing BMR with TDEE. BMR does not include any movement, walking, or digestion; it is purely the cost of staying alive in a resting state."
  },
  "hypertrophy": {
    explanation: "Hypertrophy is the enlargement of muscle fibers, typically stimulated by resistance training. It is driven by mechanical tension, muscle damage, and metabolic stress, leading to protein deposition in the muscle cells.",
    practical: "Stimulate hypertrophy by training near muscular failure (1-3 reps in reserve), utilizing a variety of rep ranges (typically 6-12), and ensuring you consume adequate daily protein for repair.",
    mistakes: "Believing hypertrophy only happens in the 8-12 rep range. Research shows similar muscle growth can be achieved in lower or higher rep ranges, provided sets are taken close to failure."
  },
  "calorie-deficit": {
    explanation: "A calorie deficit occurs when your energy intake is lower than your energy expenditure, forcing your body to draw upon stored energy reserves (predominantly body fat) to meet its metabolic demands.",
    practical: "Aim for a moderate, sustainable deficit of 300 to 500 calories below your TDEE. This supports gradual fat loss of 0.25kg to 0.5kg per week while preserving valuable muscle mass.",
    mistakes: "Creating a deficit that is too aggressive, which triggers muscle loss, extreme hunger, hormone disruption, and eventual diet abandonment."
  },
  "macros": {
    explanation: "Macronutrients—protein, carbohydrates, and fats—are the primary structural and energy components of your diet. Each plays a distinct role in fuel delivery, tissue repair, and hormonal health.",
    practical: "Determine your macro targets by prioritizing protein first (for muscle repair), then distributing fats and carbs based on your energy levels and personal preferences.",
    mistakes: "Focusing solely on total calories while ignoring macro ratios, which can lead to inadequate protein intake and subsequent muscle loss during weight loss."
  },
  "muscle-protein-synthesis": {
    explanation: "Muscle Protein Synthesis (MPS) is the biological process where your body utilizes amino acids to rebuild and repair muscle tissue damaged during training. It is the primary mechanism of muscle growth.",
    practical: "Trigger MPS effectively by eating 20-40g of high-quality protein every 3 to 4 hours, and ensuring you hit your total daily protein goal consistently.",
    mistakes: "Obsessing over the 'anabolic window' immediately post-workout while failing to hit your total daily protein target by the end of the day."
  },
  "compound-exercises": {
    explanation: "Compound exercises are multi-joint movements that engage multiple major muscle groups simultaneously. Examples include squats, deadlifts, chest presses, and overhead presses.",
    practical: "Structure your workouts by placing heavy compound movements at the beginning when your energy levels and neurological focus are highest.",
    mistakes: "Skipping compound movements in favor of easier isolation exercises, which reduces the overall efficiency and systemic strength stimulus of your routine."
  },
  "isolation-exercises": {
    explanation: "Isolation exercises target a single muscle group across a single joint. Classic examples include bicep curls, tricep extensions, and lateral raises.",
    practical: "Use isolation exercises at the end of your sessions to target specific muscles, address symmetry issues, or accumulate volume without systemic fatigue.",
    mistakes: "Relying on isolation movements for your entire workout instead of using them as accessory movements to complement core compound lifts."
  },
  "rep-ranges": {
    explanation: "Rep ranges define the number of repetitions performed in a single set. Different rep ranges stress the body in unique ways, developing strength, hypertrophy, or endurance.",
    practical: "Incorporate multiple rep ranges: 1-5 reps for strength, 6-12 reps for muscle size (hypertrophy), and 12-20+ reps for cardiovascular and local muscular endurance.",
    mistakes: "Sticking strictly to one rep range indefinitely, which limits your overall athletic development and adaptive response."
  },
  "deload": {
    explanation: "A deload is a planned, temporary reduction in training volume and intensity. It allows the body, joints, and central nervous system to fully recover from accumulated stress.",
    practical: "Schedule a deload week every 6-12 weeks. Reduce your working weights by 10-20% and cut your total sets in half to facilitate systemic recovery.",
    mistakes: "Viewing a deload as a sign of weakness or skipping it, which inevitably leads to overuse injuries, chronic fatigue, or training plateaus."
  },
  "periodization": {
    explanation: "Periodization is the systematic planning of training phases over time. It divides your fitness journey into cycles (strength, hypertrophy, recovery) to maximize long-term adaptations.",
    practical: "Structure your training into 4-8 week blocks, focusing on progressive overload within each block before transitioning to a different training stimulus or deload.",
    mistakes: "Training with the exact same exercises, weights, and intensity all year round without structured phases, causing your body to fully adapt and stall."
  },
  "training-volume": {
    explanation: "Training volume is a measure of the total work performed, calculated as Sets × Reps × Weight. It is one of the most reliable predictors of muscular hypertrophy.",
    practical: "Aim for 10 to 20 working sets per muscle group per week, split across multiple sessions, ensuring that each set is performed close to muscular failure.",
    mistakes: "Doing excessive 'junk volume'—low-effort sets that accumulate fatigue without providing a strong adaptive stimulus for muscle growth."
  },
  "mind-muscle-connection": {
    explanation: "The mind-muscle connection is the conscious visualization and focus on the target muscle during a movement. It increases motor unit recruitment and muscle activation.",
    practical: "Slow down your repetitions, focus on the squeeze at the peak of the contraction, and mentally direct the tension into the target muscle rather than just moving the weight.",
    mistakes: "Rushing through exercises and throwing weights around with momentum, which reduces targeted muscle activation and increases joint strain."
  },
  "doms": {
    explanation: "Delayed Onset Muscle Soreness (DOMS) is the pain and stiffness felt in muscles 24 to 72 hours after intense or novel physical activity, caused by microscopic muscle fiber tears.",
    practical: "Manage DOMS with light movement (active recovery), hydration, adequate sleep, and targeted protein intake. Do not let mild soreness deter you from light exercise.",
    mistakes: "Using DOMS as the primary gauge of a successful workout. Extreme soreness often indicates excessive muscle damage rather than effective stimulation."
  },
  "overtraining": {
    explanation: "Overtraining syndrome occurs when the volume and intensity of training exceed your recovery capacity over a prolonged period, leading to physical and mental stagnation.",
    practical: "Monitor warning signs like chronic fatigue, decreased performance, persistent joint pain, disrupted sleep, and irritability, and respond with rest or a deload.",
    mistakes: "Trying to push through overtraining symptoms by working out even harder, which increases injury risk and prolongs systemic fatigue."
  },
  "body-recomposition": {
    explanation: "Body recomposition is the process of simultaneously building muscle and losing fat. It challenges the traditional belief that you must bulk or cut exclusively.",
    practical: "To achieve it, eat at maintenance calories or a very slight deficit, maintain high protein intake (1.6-2.2g/kg), and follow a structured resistance training plan.",
    mistakes: "Expecting rapid weight changes on the scale. Recomposition shifts your body fat percentage and muscle mass, meaning your weight may stay stable while your measurements improve."
  },
  "reverse-dieting": {
    explanation: "Reverse dieting is the process of slowly increasing your calorie intake (usually 50-100 kcal per week) after a diet phase to rebuild your metabolic rate while minimizing fat gain.",
    practical: "Use it when transitioning out of a fat loss phase. Gradually introduce carbs and fats over several weeks until you reach your new maintenance level.",
    mistakes: "Immediately returning to pre-diet eating habits, which overwhelms your downregulated metabolism and results in rapid, excessive fat regain."
  },
  "metabolism": {
    explanation: "Metabolic adaptation is your body's defensive response to caloric restriction. To conserve energy, it reduces calorie burn through changes in hormones, digestion, and spontaneous movement (NEAT).",
    practical: "Recognize that weight loss will slow down over time. Combat adaptation by utilizing diet breaks, refeeds, and a structured reverse diet after your cutting phase.",
    mistakes: "Believing your metabolism is permanently 'broken' when weight loss stalls, rather than realizing it has adapted and requires a temporary calorie increase to reset."
  },
  "epley-formula": {
    explanation: "The Epley formula is a mathematical equation used to estimate your 1RM: 1RM = Weight × (1 + Reps/30). It is the industry standard for submaximal strength tracking.",
    practical: "Use this formula to track your strength progression across workouts without having to lift extremely heavy weights to failure, keeping your joints safe.",
    mistakes: "Applying the formula to very high rep ranges (e.g. 15-20 reps), where muscular endurance factors skew the accuracy of the estimated max."
  },
  "strength-training": {
    explanation: "Strength training involves performing physical exercises designed to improve strength, power, and muscle mass, using weights, resistance bands, or body weight.",
    practical: "Build your program around fundamental movement patterns: squat, hinge, push, pull, and carry, progressive overloading them consistently.",
    mistakes: "Constantly changing exercises every workout for 'muscle confusion' instead of sticking to core lifts and getting progressively stronger at them."
  },
  "recovery": {
    explanation: "Recovery is the active process through which your body repairs training damage, replenishes fuel stores, and adapts to training, making you stronger and fitter.",
    practical: "Prioritize the fundamentals of recovery: get 7-9 hours of quality sleep, hydrate adequately, eat sufficient protein, and manage psychological stress.",
    mistakes: "Obsessing over expensive recovery gadgets (ice baths, massage guns) while ignoring poor sleep quality and inadequate nutrition."
  },
  "fat-loss": {
    explanation: "Fat loss is the reduction of body fat while preserving muscle mass. This is different from general weight loss, which can include the loss of valuable muscle and water.",
    practical: "Combine a moderate calorie deficit with structured resistance training and high protein intake to ensure the weight you lose comes from fat, not muscle.",
    mistakes: "Doing excessive cardio and starving yourself to drop weight quickly, which strips away muscle and lowers your metabolic rate."
  },
  "protein": {
    explanation: "Protein is an essential macronutrient comprised of amino acids, which serve as the building blocks for muscle repair, hormone production, and immune function.",
    practical: "Aim for 1.6 to 2.2 grams of protein per kilogram of body weight daily, distributing it evenly across 3 to 5 protein-rich meals.",
    mistakes: "Failing to hit your total daily protein goal and only consuming protein post-workout, which limits your body's recovery potential."
  },
  "superset": {
    explanation: "A superset involves performing two exercises back-to-back with minimal rest. This increases workout density, saves time, and boosts cardiovascular demand.",
    practical: "Pair non-competing muscle groups (e.g. chest press followed by a row) to save time in the gym without sacrificing the performance of either lift.",
    mistakes: "Supersetting heavy, systemically demanding compound lifts (like squats and deadlifts), which severely impairs performance and form."
  },
  "drop-set": {
    explanation: "A drop set is a training technique where you perform an exercise to failure, immediately reduce the weight, and continue reps to target deeper muscle fibers.",
    practical: "Use drop sets sparingly on the final set of isolation exercises (like lateral raises or bicep curls) to maximize metabolic stress and muscle pump.",
    mistakes: "Performing drop sets on every single set of an exercise, which accumulates massive fatigue and compromises recovery."
  },
  "rpe": {
    explanation: "Rate of Perceived Exertion (RPE) is a subjective scale from 1 to 10 used to measure workout intensity. RPE 10 represents absolute failure, while RPE 8 means you have 2 reps in reserve.",
    practical: "Use RPE to auto-regulate your training. If you feel exhausted, adjust the weight down to hit the prescribed RPE target instead of forcing a predetermined number.",
    mistakes: "Misjudging your proximity to failure. Most beginners underestimate their capacity, rating a set as RPE 9 when it was actually RPE 7."
  },
  "time-under-tension": {
    explanation: "Time Under Tension (TUT) refers to the total duration a muscle is held under load during a set. Controlling the tempo increases mechanical tension.",
    practical: "Focus on the eccentric (lowering) phase of your lifts. Control the weight down for 2-3 seconds to maximize the hypertrophic stimulus.",
    mistakes: "Slowing down the concentric (lifting) phase excessively, which decreases power output and overall force production."
  },
  "intermittent-fasting": {
    explanation: "Intermittent fasting is an eating pattern that cycles between periods of eating and fasting, often used as a tool for caloric control.",
    practical: "Use fasting protocols (like 16:8) if they help you manage hunger and stay within your calorie targets. Ensure you still hit your protein needs.",
    mistakes: "Treating fasting as a magic fat-loss trick. If you eat in a calorie surplus during your eating window, you will still gain weight."
  }
};

function buildGlossaryPage(item) {
  const details = GLOSSARY_DETAILS[item.slug] || {
    explanation: `Understanding ${item.term.toLowerCase()} is critical for structuring your workouts and nutrition plans. It forms a key pillar of evidence-based training principles, ensuring that your efforts in the gym translate to measurable body recomposition and strength adaptations.`,
    practical: `To leverage ${item.term.toLowerCase()} effectively, keep consistent logs of your training variables (sets, reps, weights, and rest periods). Make small, measured adjustments to your schedule and diet based on how your body is recovering and responding weekly.`,
    mistakes: `A major mistake is changing too many variables at once. For example, altering your training volume, exercise selection, and calorie targets simultaneously makes it impossible to pinpoint what is working and what is causing stagnation or fatigue.`
  };

  const relatedLinks = item.related
    .map(r => { const found = TERMS.find(t => t.slug === r); return found ? `<a href="/glossary/${r}">${found.term}</a>` : null; })
    .filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.term} — What It Is, Why It Matters & Practical Guide | IZEM Glossary</title>
    <meta name="description" content="${item.definition.substring(0, 155)}">
    <link rel="canonical" href="https://youraicoach.life/glossary/${item.slug}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": "${item.term}",
        "description": "${item.definition.replace(/"/g, '\\"')}",
        "url": "https://youraicoach.life/glossary/${item.slug}",
        "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "Fitness Glossary", "url": "https://youraicoach.life/glossary/"}
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.8}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:700px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}article{max-width:700px;margin:0 auto;padding:60px 24px 80px}h1{font-size:2.4rem;font-weight:800;margin-bottom:24px;color:#F8FAFC}h2{font-size:1.5rem;font-weight:700;margin:36px 0 16px;color:#00D4FF}.breadcrumb{font-size:.85rem;color:#475569;margin-bottom:24px}.breadcrumb a{color:#475569;text-decoration:none}p{margin-bottom:20px;color:#CBD5E1;font-size:1.05rem}.def-box{padding:24px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);border-radius:16px;margin:24px 0;font-size:1.15rem;line-height:1.9}.related{margin-top:40px;padding:20px;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px}.related h3{color:#00D4FF;margin-bottom:12px;font-size:1rem}.related a{color:#00D4FF;text-decoration:none;border-bottom:1px solid rgba(0,212,255,0.3)}.cta-box{margin-top:40px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;margin:4px}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/glossary/" style="color:#94A3B8;font-size:.9rem;text-decoration:none">← Glossary</a></div></nav>
<article>
    <div class="breadcrumb"><a href="/">Home</a> → <a href="/glossary/">Glossary</a> → ${item.term}</div>
    <h1>${item.term}</h1>
    <div class="def-box"><p style="margin:0"><strong style="color:#00D4FF">Definition:</strong> ${item.definition}</p></div>
    
    <h2>Detailed Explanation</h2>
    <p>${details.explanation}</p>
    
    <h2>Practical Application & Guide</h2>
    <p>${details.practical}</p>
    
    <h2>Common Pitfalls & Mistakes</h2>
    <p>${details.mistakes}</p>
    
    <h2>How IZEM Automates It</h2>
    <p>Rather than managing these variables manually, the IZEM AI Coach handles the calculations and progression cycles for you. IZEM dynamically monitors your performance, applies evidence-based training principles, tracks metrics like 1RM and volume, and proactively adjusts your workout and meal plans every week to prevent plateaus and optimize recovery.</p>

    ${relatedLinks ? `<div class="related"><h3>📚 Related Terms</h3><p>${relatedLinks}</p></div>` : ''}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>IZEM applies these principles automatically.</strong></p>
        <a href="/izem-ai-fitness-coach/" class="cta">Explore IZEM</a>
    </div>
</article>
</body>
</html>`;
}

function buildGlossaryIndex() {
  const cards = TERMS.map(t => `<a href="/glossary/${t.slug}" class="term-card"><h3>${t.term}</h3><p>${t.definition.substring(0, 100)}...</p></a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fitness Glossary — 30+ Terms Explained Simply | IZEM</title>
    <meta name="description" content="Complete fitness glossary: progressive overload, TDEE, 1RM, macros, hypertrophy, and 25+ more terms explained in simple language.">
    <link rel="canonical" href="https://youraicoach.life/glossary/">
    <meta name="robots" content="index, follow">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:48px 24px}h1{font-size:2.4rem;font-weight:800;margin-bottom:8px;color:#F8FAFC}.sub{color:#94A3B8;margin-bottom:40px;font-size:1.05rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}.term-card{display:block;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-decoration:none;transition:all .3s}.term-card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.term-card h3{color:#00D4FF;font-size:1.1rem;margin-bottom:8px}.term-card p{color:#94A3B8;font-size:.85rem;margin:0;line-height:1.5}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/blog/" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Blog</a></div></nav>
<div class="c">
     <h1>Fitness Glossary</h1>
     <p class="sub">${TERMS.length} essential fitness terms explained simply — no jargon, no BS.</p>
     <div class="grid">${cards}</div>
</div>
</body>
</html>`;
}

// Generate all pages
if (!fs.existsSync(GLOSSARY_DIR)) fs.mkdirSync(GLOSSARY_DIR, { recursive: true });

for (const term of TERMS) {
  fs.writeFileSync(path.join(GLOSSARY_DIR, `${term.slug}.html`), buildGlossaryPage(term));
}
fs.writeFileSync(path.join(GLOSSARY_DIR, 'index.html'), buildGlossaryIndex());

// Update sitemap
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
if (fs.existsSync(SITEMAP_PATH)) {
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const glossaryUrls = TERMS.map(t => `  <url><loc>https://youraicoach.life/glossary/${t.slug}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`).join('\n');
  const toolsUrl = `  <url><loc>https://youraicoach.life/tools/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`;
  const glossaryIndexUrl = `  <url><loc>https://youraicoach.life/glossary/</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`;
  for (const entry of [glossaryIndexUrl, toolsUrl, ...glossaryUrls.split('\n')]) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc && !sitemap.includes(`<loc>${loc}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
    }
  }
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

console.log(`✅ Generated ${TERMS.length} glossary pages + index`);
console.log(`✅ Generated /tools calculator page`);
console.log(`✅ Updated sitemap.xml`);
