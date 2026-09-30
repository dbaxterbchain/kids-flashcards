// "How it works" explanations for library cards, and "How this set works" introductions for library
// sets. Written to be read aloud by a grown-up, or by older kids on their own.

const lines = (...paragraphs: string[]) => paragraphs.join('\n');

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const listWords = (words: string[]) =>
  words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

// --- Set introductions ---------------------------------------------------------------------------

export const SET_ABOUT: Record<string, string> = {
  'animal-groups': lines(
    'Scientists sort animals into groups by what their bodies are like.',
    'Mammals have hair or fur and feed their babies milk. Birds have feathers and lay eggs. Reptiles have dry, scaly skin. Amphibians start life in water, then live on land too. Fish breathe underwater with gills. Insects have six legs.',
    'Some are tricky: whales and bats are mammals, and penguins are birds. Tap the light bulb on a card to find out why.',
  ),
  'solid-liquid-gas': lines(
    'Everything is made of tiny bits, far too small to see. In a solid they are packed tight and stay in place, so a solid keeps its shape. In a liquid they slide around each other, so a liquid flows and takes the shape of its container. In a gas they zoom about, far apart, so a gas spreads out to fill any space.',
    'Heating and cooling can change one into another: ice melts into water, and water boils into steam.',
    'Each card shows something to sort. Is it a solid, a liquid or a gas?',
  ),
  planets: lines(
    'Our solar system is the Sun and everything that travels around it. Eight planets circle the Sun. In order from the Sun, they are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune.',
    'A way to remember the order: My Very Educated Mother Just Served Us Nachos.',
    'The four closest to the Sun are small and rocky. The four farther out are giants, made mostly of gas and ice. The Sun is a star, and the Moon travels around the Earth.',
  ),
  'science-tools': lines(
    'Scientists find things out by looking closely, measuring and testing. These tools help them see what eyes alone cannot, and measure how big, heavy, hot or fast something is.',
    'Lots of them are in your home too: look for a ruler, a thermometer, a magnet or a magnifying glass.',
  ),
  'element-symbols': lines(
    'Everything around us is made of elements: 118 have been found so far. Scientists write each one with a short symbol: a capital letter, sometimes followed by a small letter, like O for oxygen and Mg for magnesium.',
    'Some symbols don\'t match the English name, because they come from Latin: Fe is from ferrum (iron), Au from aurum (gold), Ag from argentum (silver), Cu from cuprum (copper), Na from natrium (sodium) and K from kalium (potassium).',
    'All the elements are arranged in a chart called the periodic table.',
  ),
  'life-cycles': lines(
    'A life cycle is how a living thing grows and changes, from the start of its life until it has young of its own, which start the cycle again.',
    'These cards follow four life cycles: a butterfly (egg, caterpillar, chrysalis, butterfly), a frog (egg, tadpole, frog), a chicken (egg, chick, hen) and a plant (seed, sprout, flower). Try putting each one in order.',
  ),
  'plant-parts': lines(
    'Every part of a plant has a job. Roots drink water from the soil, the stem carries it up, leaves use sunlight to make food, and flowers make seeds. Fruit holds the seeds, and seeds grow into new plants.',
    'We eat every part: carrots are roots, asparagus is a stem, lettuce is leaves, broccoli is flowers and apples are fruit.',
  ),
  'human-body': lines(
    'Inside your body are parts called organs, and each one has a job. Your brain is in charge, your heart pumps blood, your lungs breathe, your bones hold you up and your muscles move you. They all work together.',
    'Try it as you go: feel your heart beat, take a big breath, or find the bones in your hand.',
  ),
  'numbers-11-20': lines(
    'The numbers from 11 to 19 are made of one ten and some ones. Each card shows two ten-frames: the first is full (that\'s the ten), and the second shows the ones. So 14 is a full ten and 4 more.',
    'Count the dots together, starting from 10 for the full frame: 10… 11, 12, 13, 14.',
  ),
  '3d-shapes': lines(
    'Flat shapes like squares and circles are 2D: you can draw them on paper. 3D shapes are solid: you can pick them up and turn them around.',
    'The flat sides of a 3D shape are called faces. The lines where two faces meet are edges, and the corners are called vertices.',
    'Go on a shape hunt: cans, boxes, balls and cones are all around the house.',
  ),
  doubles: lines(
    'A double is a number added to itself, like 4 + 4. It\'s two groups of the same size, so every double is an even number.',
    'Look for doubles around you: two hands with 5 fingers each make 10, and a spider has 4 legs on each side, 8 in all.',
  ),
  'take-away': lines(
    'Taking away means starting with a number and removing some. To find what\'s left, start at the first number and count back.',
    'Use fingers or small toys: put out 7, take away 4, and count the ones left. Check the answer by adding back what you took away.',
  ),
  'make-ten': lines(
    'Each card asks what goes with a number to make 10. The pairs that make 10 (1 and 9, 2 and 8, 3 and 7, 4 and 6, 5 and 5) make adding and taking away much quicker later on.',
    'Use fingers: hold up 10, fold down the number on the card, and count the fingers still up.',
  ),
  'skip-counting': lines(
    'Skip counting means counting on by the same amount each time, like 2, 4, 6, 8. Each card shows three numbers in a pattern. Work out how much they go up by, then add that on once more to find the next number.',
    'Skip counting by 2s, 5s and 10s makes counting big groups quicker, and it\'s the start of the times tables.',
  ),
  'telling-time': lines(
    'A clock has two hands. The short hand points to the hour. The long blue hand points to the minutes: it goes all the way around once every hour.',
    'When the long hand points straight up at 12, it\'s o\'clock. When it points down at 6, it\'s halfway around: half past. At 3 it\'s a quarter of the way around, quarter past. At 9 there\'s a quarter of the hour left: quarter to the next hour.',
    'Look for clocks around the house and read them together.',
  ),
  'times-2': timesAbout(2, 'The 2 times table doubles each number.'),
  'times-5': timesAbout(5, 'Answers in the 5 times table always end in 5 or 0.'),
  'times-10': timesAbout(10, 'In the 10 times table, each number just gets a 0 on the end.'),
  fractions: lines(
    'A fraction is part of a whole. Each card shows a circle cut into equal parts, with some of the parts colored in.',
    'The bottom number of a fraction says how many equal parts the whole is cut into. The top number says how many of those parts there are. So 3/4, three quarters, is 3 of 4 equal parts.',
    'Try it with food: cut a sandwich or a pizza into equal pieces and name the fractions together.',
  ),
  'days-of-the-week': lines(
    'There are seven days in a week, always in the same order. The front of each card shows the short name you\'d see on a calendar, like Mon for Monday.',
    'Say the days in order together, talk about what happens on each one, and ask what day comes next. Tap the light bulb to find out where each day\'s name comes from.',
  ),
  months: lines(
    'There are twelve months in a year, always in the same order. The front of each card shows the short name you\'d see on a calendar, like Jan for January.',
    'To remember how long they are: "Thirty days has September, April, June and November. All the rest have thirty-one, except February, which has twenty-eight, or twenty-nine in a leap year."',
  ),
  flags: lines(
    'Every country has its own flag. The colors and shapes on a flag usually stand for something about the country: its land, its history or what its people care about.',
    'Look for stripes going across (horizontal) and up and down (vertical), crosses, stars and circles. Tap the light bulb on a card to find out what its flag shows.',
  ),
  'computer-parts': lines(
    'Computers take in information, work on it, and give something back. Parts that put information in, like keyboards, mice, microphones and cameras, are called input devices. Parts that give information out, like screens, printers and headphones, are called output devices.',
    'Talk about which is which as you go through the cards.',
  ),
  'coding-words': lines(
    'Coding means writing instructions for a computer. These words come up in beginner coding lessons and apps, like Scratch.',
    'Try them without a computer: write an algorithm for making a sandwich, give each other step-by-step directions (a sequence), and use loops ("do it 3 times") and conditions ("if you see a red block, stop").',
  ),
  binary: lines(
    'Computers store every number using just two digits, 0 and 1, because each tiny switch inside a computer is either off (0) or on (1). Counting with just 0 and 1 is called binary.',
    'Each card shows a 4-digit binary number. Read its places from the right: they\'re worth 1, 2, 4 and 8, each double the one before. Add up the places that have a 1: 0110 is 4 + 2 = 6.',
    'With four digits you can count from 0 (0000) up to 15 (1111). Tap the light bulb on a card to see how its number adds up.',
  ),
};

function timesAbout(factor: number, tip: string) {
  return lines(
    `Multiplying is a quick way to add the same number again and again. ${factor} × 4 means four ${factor}s: ${Array(4)
      .fill(factor)
      .join(' + ')} = ${factor * 4}. The order doesn't matter: 4 × ${factor} is the same.`,
    `To work out a card, skip count by ${factor}s: ${[1, 2, 3].map((n) => n * factor).join(', ')}… and stop after the second number on the card. ${tip}`,
  );
}

// --- Math ----------------------------------------------------------------------------------------

export function explainBinary(value: number) {
  const digits = value.toString(2).padStart(4, '0');
  const places = [8, 4, 2, 1].filter((_, index) => digits[index] === '1');
  const rule = 'In binary, each place is worth double the place to its right. From the right, the places are worth 1, 2, 4 and 8.';
  if (places.length === 0) return lines(rule, `${digits} has no 1s at all, so it's 0.`);
  if (places.length === 1) return lines(rule, `${digits} has a 1 only in the ${places[0]}s place, so it's ${value}.`);
  const sum = `${places.join(' + ')} = ${value}`;
  const found = `${digits} has a 1 in the ${listWords(places.map((place) => `${place}s`))} places.`;
  return value === 15 ? lines(rule, found, sum, "That's the biggest number four binary digits can make!") : lines(rule, found, sum);
}

export function explainDouble(value: number) {
  const extras: Record<number, string> = {
    2: 'A dog has 4 legs: 2 at the front and 2 at the back.',
    3: 'An insect has 6 legs: 3 on each side.',
    4: 'A spider has 8 legs: 4 on each side.',
    5: 'Your two hands have 5 fingers each: 10 fingers.',
    6: 'An egg carton holds 12 eggs in two rows of 6.',
    7: 'Two weeks are 14 days: 7 + 7.',
    10: 'All your fingers and toes: 10 + 10 = 20.',
  };
  return lines(
    `${value} + ${value} is two groups of ${value}, which makes ${value * 2}. It's the same as 2 × ${value}.`,
    ...(extras[value] ? [extras[value]] : []),
  );
}

export function explainTakeAway(from: number, away: number) {
  const left = from - away;
  const countBack = Array.from({ length: away }, (_, index) => from - index - 1).join(', ');
  return lines(
    `Start with ${from} and take away ${away}. Count back ${away} from ${from}: ${countBack}. That leaves ${left}${
      left === 0 ? ', nothing at all' : ''
    }.`,
    `Check it by adding back: ${left} + ${away} = ${from}`,
  );
}

export function explainMakeTen(value: number) {
  const other = 10 - value;
  return lines(
    `Hold up 10 fingers and fold down ${value}. The ${plural(other, 'finger')} still up ${
      other === 1 ? 'is' : 'are'
    } what goes with ${value} to make 10.`,
    `${value} + ${other} = 10`,
    value === 5 ? 'Two 5s make 10: one on each hand.' : `${other} + ${value} makes 10 too.`,
  );
}

export function explainSkipCounting(start: number, step: number) {
  const terms = [start, start + step, start + 2 * step];
  const next = start + 3 * step;
  let tip = '';
  if (step === 1) tip = 'Counting by 1s is just counting!';
  if (step === 2) tip = `Counting by 2s from ${start % 2 === 0 ? 'an even number lands on the even numbers' : 'an odd number lands on the odd numbers'}.`;
  if (step === 5) tip = 'Counting by 5s, the numbers take turns ending in 5 and 0.';
  if (step === 10) tip = 'Counting by 10s, the ones digit stays the same and the tens go up by one each time.';
  if ((step === 3 || step === 4) && start === step) tip = `Counting by ${step}s from ${step} gives the ${step} times table.`;
  return lines(
    `Each number is ${step} more than the one before: ${terms.join(', ')}. So the next one is ${step} more than ${terms[2]}.`,
    `${terms[2]} + ${step} = ${next}`,
    ...(tip ? [tip] : []),
  );
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function explainTimes(factor: number, times: number) {
  const product = factor * times;
  const meaning =
    times === 1
      ? `${factor} × 1 means just one ${factor}, so it's ${factor}.`
      : `${factor} × ${times} means ${NUMBER_WORDS[times] ?? times} ${factor}s added together.`;
  const working =
    times === 1
      ? []
      : times <= 5
        ? [`${Array(times).fill(factor).join(' + ')} = ${product}`]
        : [
            `Skip count by ${factor}s, ${times} times: ${Array.from({ length: times }, (_, index) => (index + 1) * factor).join(', ')}.`,
          ];
  return lines(meaning, ...working, `The order doesn't matter: ${times} × ${factor} = ${product} too.`);
}

export function explainTeen(value: number, name: string) {
  const ones = value - 10;
  if (value === 20) {
    return lines(
      '20 is two full tens: 10 + 10 = 20. Both ten-frames are full.',
      'Twenty means "two tens", just like thirty means three tens and forty means four tens.',
    );
  }
  const names: Record<number, string> = {
    11: 'Eleven has its own special name. It comes from an old word meaning "one left over", after counting to ten.',
    12: 'Twelve has its own special name too. It comes from an old word meaning "two left over", after counting to ten.',
  };
  const word = name.toLowerCase();
  const onesWord = word.replace(/teen$/, '').replace('thir', 'three').replace('fif', 'five').replace(/eigh$/, 'eight');
  return lines(
    `${value} is one full ten and ${ones} more: 10 + ${ones} = ${value}. The first ten-frame is full, and the second has ${plural(ones, 'dot')}.`,
    names[value] ?? `The "teen" in ${word} means ten: ${word} is ${onesWord} and ten.`,
  );
}

export function explainFraction(parts: number, shaded: number, name: string) {
  if (parts === 1) {
    return lines(
      'The whole circle is colored in, with nothing cut away. That\'s one whole: all of it.',
      'As a fraction it\'s 1/1, which is the same as 1. Two halves, three thirds or four quarters all make one whole too.',
    );
  }
  const extras: Record<string, string> = {
    'One half': 'Two halves make a whole.',
    'One third': 'Three thirds make a whole.',
    'Two thirds': 'One more third would make the whole circle.',
    'One quarter': 'One quarter is also called one fourth. Four quarters make a whole.',
    'Three quarters': 'One more quarter would make the whole circle.',
    'One fifth': 'Five fifths make a whole.',
    'One sixth': 'The more parts a whole is cut into, the smaller each part is: one sixth is smaller than one fifth.',
    'One eighth': 'One eighth is half of one quarter. Eight eighths make a whole.',
  };
  return lines(
    `The circle is cut into ${parts} equal parts, and ${shaded} ${shaded === 1 ? 'is' : 'are'} colored in. That's ${name.toLowerCase()}, written ${shaded}/${parts}.`,
    `The bottom number, ${parts}, says how many equal parts make the whole. The top number, ${shaded}, says how many of those parts there are.`,
    ...(extras[name] ? [extras[name]] : []),
  );
}

export function explainClock(hours: number, minutes: number, name: string) {
  const next = (hours % 12) + 1;
  const digital = `${hours}:${String(minutes).padStart(2, '0')}`;
  if (minutes === 0) {
    return hours === 12
      ? 'Both hands point straight up at 12, so it\'s 12 o\'clock: the middle of the day (noon) or the middle of the night (midnight). On a digital clock it\'s 12:00.'
      : lines(
          `The long blue hand points straight up at 12, so it's exactly on the hour: o'clock. The short hand points at ${hours}, so it's ${name}.`,
          `On a digital clock it's ${digital}.`,
        );
  }
  if (minutes === 30) {
    return lines(
      `The long blue hand points down at 6. That's halfway around the clock, 30 minutes, so it's half past. The short hand is halfway between ${hours} and ${next}, so it's half past ${hours}.`,
      `On a digital clock it's ${digital}.`,
    );
  }
  if (minutes === 15) {
    return lines(
      `The long blue hand points at 3. That's a quarter of the way around the clock, 15 minutes, so it's quarter past. The short hand has just passed ${hours}, so it's quarter past ${hours}.`,
      `On a digital clock it's ${digital}.`,
    );
  }
  return lines(
    `The long blue hand points at 9. That's three quarters of the way around, so there's just a quarter of an hour, 15 minutes, until ${next} o'clock. The short hand is nearly at ${next}, so it's quarter to ${next}.`,
    `On a digital clock it's ${digital}.`,
  );
}

// --- Days and months -----------------------------------------------------------------------------

export const DAY_EXPLANATIONS: Record<string, string> = {
  monday: 'Mon is short for Monday, the day after Sunday. Monday means "Moon\'s day".',
  tuesday: 'Tue is short for Tuesday, the day after Monday. It\'s named after Tiw, a god in old stories from northern Europe.',
  wednesday:
    'Wed is short for Wednesday, the day after Tuesday. It\'s named after Woden, another god from those old stories. That\'s why Wednesday has a d we don\'t say.',
  thursday: 'Thu is short for Thursday, the day after Wednesday. It\'s named after Thor, the god of thunder.',
  friday: 'Fri is short for Friday, the day after Thursday. It\'s named after Frigg, a goddess from the same old stories as Thor.',
  saturday: 'Sat is short for Saturday, the day after Friday. It\'s named after Saturn, a Roman god, like the planet.',
  sunday: 'Sun is short for Sunday, the day after Saturday. Sunday means "Sun\'s day". Then the week starts again with Monday.',
};

export const MONTH_EXPLANATIONS: Record<string, string> = {
  january:
    'Jan is short for January, the first month of the year. It\'s named after Janus, a Roman god of doors and new beginnings, who had two faces: one looking back at the old year and one looking forward to the new one.',
  february:
    'Feb is short for February, the second month. It\'s the shortest month, with 28 days, or 29 in a leap year, which comes about every four years.',
  march: 'Mar is short for March, the third month. It\'s named after Mars, the Roman god of war, like the red planet.',
  april: 'Apr is short for April, the fourth month. Its name may come from a Latin word meaning "to open", like buds and flowers opening.',
  may: 'May is the fifth month. Its name is already short, so it stays May! It\'s named after Maia, a Roman goddess of growing things.',
  june: 'Jun is short for June, the sixth month. It\'s named after Juno, the queen of the Roman gods.',
  july: 'Jul is short for July, the seventh month. It\'s named after Julius Caesar, a famous Roman leader who was born in this month.',
  august: 'Aug is short for August, the eighth month. It\'s named after Augustus, the first Roman emperor.',
  september:
    'Sep is short for September, the ninth month. Septem means seven in Latin: long ago, the Roman year started in March, so September was the seventh month.',
  october:
    'Oct is short for October, the tenth month. Octo means eight in Latin (an octopus has eight arms), because it used to be the eighth month.',
  november: 'Nov is short for November, the eleventh month. Novem means nine in Latin: it used to be the ninth month.',
  december:
    'Dec is short for December, the twelfth and last month. Decem means ten in Latin: it used to be the tenth month. After December, a new year starts with January.',
};

// --- Science -------------------------------------------------------------------------------------

export const ANIMAL_GROUP_EXPLANATIONS: Record<string, string> = {
  dog: 'A dog is a mammal. Mammals have hair or fur, breathe air, and feed their babies milk. People are mammals too!',
  elephant:
    'An elephant is a mammal: it has hair (not much!), breathes air, and its babies drink their mother\'s milk. It\'s the biggest animal that lives on land.',
  whale:
    'A whale lives in the sea, but it\'s a mammal, not a fish! It breathes air through a blowhole on top of its head, and feeds its babies milk. Fish breathe underwater with gills instead.',
  bat: 'A bat can fly, but it\'s a mammal, not a bird! It has fur instead of feathers, and its babies drink milk. Bats are the only mammals that can really fly.',
  bird: 'Birds have feathers, wings and a beak, and they hatch from eggs with hard shells. Most birds can fly.',
  penguin:
    'A penguin can\'t fly, but it\'s still a bird: it has feathers, wings and a beak, and it hatches from an egg. Its wings work like flippers for swimming.',
  owl: 'An owl is a bird: it has feathers, wings and a beak, and it hatches from an egg. Most owls hunt at night, and they can turn their heads much farther than we can.',
  snake:
    'A snake is a reptile. Reptiles have dry, scaly skin, breathe air, and most lay eggs. Their bodies don\'t make their own heat, so they warm up in the sun.',
  turtle:
    'A turtle is a reptile, with scaly skin and a hard shell to hide in. Even sea turtles breathe air, and they crawl up onto beaches to lay their eggs in the sand.',
  crocodile: 'A crocodile is a reptile, covered in tough scales. It spends lots of time in water, but it breathes air and lays its eggs on land.',
  frog: 'A frog is an amphibian. Amphibians start life in water, breathing with gills like a fish, then grow lungs so they can live on land too. Their skin is smooth and damp, not scaly.',
  fish: 'Fish live in water and breathe with gills, which take oxygen out of the water. They have fins for swimming, and most have scales.',
  shark:
    'A shark is a fish! It breathes underwater with gills and swims with fins and a strong tail. Its skeleton is made of bendy cartilage, like the tip of your nose, instead of bone.',
  bee: 'A bee is an insect. Insects have six legs and three body parts: a head, a middle and an abdomen at the back. Most have wings and two feelers called antennae.',
  ladybug:
    'A ladybug is an insect: count its six legs! Its spotted red back is really a pair of hard wing covers. They open up, and thin wings for flying unfold from underneath.',
  butterfly: 'A butterfly is an insect, with six legs, three body parts and four wings. It started life as a caterpillar.',
};

export const STATE_EXPLANATIONS: Record<string, string> = {
  ice: 'Ice is a solid: it keeps its own shape, and you can pick it up. Ice is frozen water. When it warms up, it melts into liquid water.',
  brick: 'A brick is a solid. Solids keep their shape, wherever you put them. That\'s why we can stack bricks to build walls.',
  spoon: 'A spoon is a solid: it keeps its shape in a drawer, in a bowl or in your hand. Solids can be hard like a spoon or soft like a pillow, but they don\'t flow.',
  water:
    'Water is a liquid: it flows, and takes the shape of whatever holds it, like a cup or a puddle. Freeze it and it becomes solid ice. Boil it and it becomes a gas.',
  milk: 'Milk is a liquid. Pour it into a cup and it takes the shape of the cup. Pour it into a bowl and it takes the shape of the bowl.',
  honey:
    'Honey is a liquid, even though it\'s thick and slow. It still flows, and takes the shape of its jar. Scientists call a thick, slow liquid viscous.',
  air: 'Air is a gas. A gas spreads out to fill whatever space it\'s in. You can\'t see air, but you can feel it when the wind blows.',
  balloon:
    'A balloon is filled with a gas: air, or helium, which is lighter than air, so the balloon floats. The gas pushes out in every direction to fill the whole balloon.',
  steam:
    'Steam is water that got so hot it turned into a gas. As it cools, it turns back into tiny drops of water. That\'s the misty cloud you see above a hot drink, and why mirrors fog up after a bath.',
};

export const PLANET_EXPLANATIONS: Record<string, string> = {
  sun: 'The Sun is a star: a giant ball of hot, glowing gas. It\'s so big that about a million Earths could fit inside it. Its light and warmth make life on Earth possible. Never look straight at the Sun!',
  mercury:
    'Mercury is the smallest planet and the closest to the Sun. It races around the Sun in just 88 days, so a year there is very short. It\'s covered in craters, a lot like our Moon.',
  venus:
    'Venus is the hottest planet, even hotter than Mercury, because its thick clouds trap the Sun\'s heat like a blanket. It\'s the brightest planet in our sky, and is sometimes called the evening star.',
  earth: 'Earth is our home, the third planet from the Sun. It\'s the only planet we know of with living things. From space it looks blue, because oceans cover most of it.',
  moon: 'The Moon isn\'t a planet: it travels around the Earth. It doesn\'t make its own light. It shines because sunlight bounces off it. Astronauts first walked on the Moon in 1969.',
  mars: 'Mars is called the red planet, because its dusty ground is full of rust. It has the tallest volcano in the solar system, and robot rovers have driven around on it, taking pictures.',
  jupiter:
    'Jupiter is the biggest planet: more than 1,000 Earths could fit inside it. It\'s a gas giant, with no solid ground to stand on. Its Great Red Spot is a storm bigger than the whole Earth.',
  saturn:
    'Saturn is famous for its rings, made of billions of pieces of ice and rock circling the planet. It\'s a gas giant so light for its size that it would float in a giant bathtub of water!',
  uranus:
    'Uranus spins on its side, like a ball rolling around the Sun, probably because something huge crashed into it long ago. It\'s an ice giant, and a gas called methane makes it look blue-green.',
  neptune:
    'Neptune is the farthest planet from the Sun, so it\'s very cold and dark. It\'s a deep blue ice giant with the fastest winds in the solar system. One trip around the Sun takes it about 165 years.',
};

export const SCIENCE_TOOL_EXPLANATIONS: Record<string, string> = {
  microscope:
    'A microscope uses lenses, specially curved pieces of glass, to make tiny things look much bigger. It shows things too small for your eyes to see, like the cells that living things are made of.',
  telescope: 'A telescope collects light from things far away, like the Moon, planets and stars, and makes them look bigger and brighter.',
  magnet:
    'A magnet pulls on things made of iron and steel, like paper clips and fridge doors. Every magnet has two ends, called poles. Different poles pull together, and matching poles push apart.',
  'test-tube': 'A test tube is a thin glass tube for holding, mixing and heating small amounts of liquid in experiments.',
  thermometer:
    'A thermometer measures how hot or cold something is: its temperature. Doctors use one to check for a fever, and a weather thermometer tells us how warm it is outside.',
  scale: 'A scale measures how heavy something is. This one is a balance: put a thing on each side, and the heavier side goes down.',
  'magnifying-glass':
    'A magnifying glass is one curved lens that makes things look bigger. It\'s great for looking closely at bugs, leaves, rocks and fingerprints.',
  'petri-dish':
    'A petri dish is a shallow see-through dish with a lid. Scientists use them to grow tiny living things, like bacteria and mold, so they can study them.',
  goggles: 'Safety goggles protect your eyes from splashes, dust and flying bits. Scientists wear them whenever an experiment could splash or spill.',
  battery:
    'A battery stores energy and gives it out as electricity, to power things like flashlights, toys and remote controls. Every battery has a plus (+) end and a minus (−) end.',
  stopwatch: 'A stopwatch measures how long something takes. Press start, then stop, and it shows the time in minutes and seconds. Great for timing races!',
  ruler: 'A ruler measures how long something is, in centimeters or inches. Line up the 0 with one end of the thing you\'re measuring, and read the number at the other end.',
};

export const ELEMENT_EXPLANATIONS: Record<string, string> = {
  hydrogen:
    'H stands for hydrogen, the lightest element and the most common one in the universe. Stars like the Sun are mostly hydrogen. Two hydrogen atoms joined to one oxygen atom make water: H₂O.',
  helium:
    'He stands for helium. It\'s lighter than air, which is why helium balloons float up. It needs two letters, He, because H was already taken by hydrogen.',
  carbon:
    'C stands for carbon. It\'s in every living thing, including you! Diamonds and the "lead" in pencils (called graphite) are both made of pure carbon.',
  nitrogen: 'N stands for nitrogen, a gas with no color or smell. Most of the air you breathe, about four fifths of it, is nitrogen.',
  oxygen:
    'O stands for oxygen, the gas in the air that we need to breathe. Plants give it off when they make their food, and it\'s the O in H₂O, water.',
  sodium:
    'Na comes from natrium, the old Latin name for sodium. Sodium is part of table salt, whose chemical name is sodium chloride, NaCl.',
  magnesium:
    'Mg stands for magnesium. In two-letter symbols the second letter is small, so it\'s Mg, not MG. Magnesium is a light metal that burns with a dazzling white flame, used in fireworks and sparklers.',
  chlorine:
    'Cl stands for chlorine. A little chlorine keeps swimming pools clean. Joined with sodium, it makes table salt: NaCl.',
  potassium:
    'K comes from kalium, the old Latin name for potassium. Bananas are full of potassium, and your muscles and nerves need it to work.',
  calcium: 'Ca stands for calcium. Your bones and teeth are built with calcium, and milk, cheese and yogurt have lots of it. Chalk and seashells are made with calcium too.',
  iron: 'Fe comes from ferrum, the Latin word for iron. Iron is a strong metal used to make steel. It\'s in your blood too, carrying oxygen around your body. Rust is iron joined with oxygen.',
  copper:
    'Cu comes from cuprum, the Latin name for copper. Copper carries electricity well, so most electrical wires are made of it. The Statue of Liberty is made of copper, which slowly turned green.',
  silver: 'Ag comes from argentum, the Latin word for silver. Silver is a shiny metal used for jewelry, coins and mirrors. The country Argentina is named after it!',
  gold: 'Au comes from aurum, the Latin word for gold. Gold never rusts, so gold coins and jewelry stay shiny for thousands of years.',
};

export const LIFE_CYCLE_EXPLANATIONS: Record<string, string> = {
  egg: 'Lots of animals start life as an egg: birds, butterflies, frogs, fish, snakes and turtles. The baby grows inside until it\'s ready to hatch.',
  caterpillar:
    'A caterpillar hatches from a tiny egg that a butterfly laid on a leaf. It eats and eats, and grows so fast that it sheds its skin several times.',
  chrysalis:
    'When a caterpillar is fully grown, it makes a hard case around itself called a chrysalis. Inside, its body changes completely into a butterfly. This big change is called metamorphosis.',
  butterfly:
    'When it\'s ready, a butterfly comes out of the chrysalis, with wings! It lays eggs, and the life cycle starts again: egg, caterpillar, chrysalis, butterfly.',
  tadpole:
    'Frogs lay their eggs in water, and tadpoles hatch out. A tadpole lives underwater, breathing with gills and swimming with its tail. Slowly it grows legs, and its tail shrinks away.',
  frog: 'A grown-up frog breathes air and can live on land and in water. It lays its eggs in water, and the life cycle starts again: egg, tadpole, frog.',
  chick: 'A chick grows inside its egg for about three weeks, kept warm by its mother. Then it pecks its way out of the shell.',
  hen: 'A hen is a grown-up female chicken. She lays eggs and sits on them to keep them warm, and chicks hatch out. The chicks grow up into hens and roosters, and the cycle starts again.',
  seed: 'A seed holds a tiny baby plant and a packed lunch of food for it. With water, warmth and soil, it starts to grow.',
  sprout: 'A sprout is a young plant that has just pushed up out of the soil. Its roots grow down to find water, and its first leaves grow up toward the light.',
  flower:
    'Flowers make seeds. Bees and other insects carry pollen from flower to flower, and then the flower can make seeds. The seeds fall or blow away and grow into new plants.',
};

export const PLANT_PART_EXPLANATIONS: Record<string, string> = {
  roots:
    'Roots grow down into the soil. They hold the plant in place and soak up water, like lots of tiny drinking straws. Carrots and radishes are roots we eat!',
  stem: 'The stem holds the plant up toward the light. Tiny tubes inside it carry water up from the roots to the leaves. Asparagus and potatoes are stems we eat.',
  leaves:
    'Leaves are the plant\'s kitchen: they use sunlight, air and water to make food for the plant. They also give off oxygen, the gas we breathe. Lettuce and spinach are leaves we eat.',
  flower:
    'Flowers make seeds. Their bright colors and sweet smells bring bees and butterflies, which carry pollen from flower to flower so seeds can grow. Broccoli is a bunch of flower buds!',
  seed: 'A seed has a baby plant inside, with food to help it start growing. Plant it in soil and water it, and it can grow into a whole new plant. Peas and beans are seeds we eat.',
  fruit: 'A fruit is the part of a plant that holds its seeds. Animals eat fruit and spread the seeds around. Tomatoes, cucumbers and peppers have seeds inside, so they\'re fruits too!',
};

export const BODY_EXPLANATIONS: Record<string, string> = {
  brain:
    'Your brain is the control center of your body. It does your thinking, remembering and feeling, and it sends messages along nerves to move every part of you. It keeps working even while you sleep.',
  heart: 'Your heart is a strong muscle about the size of your fist. It squeezes about 100,000 times every day, pumping blood all around your body. Each squeeze is a heartbeat.',
  lungs:
    'Your two lungs are in your chest. When you breathe in, they fill with air, and take oxygen from it into your blood. When you breathe out, they push out a gas your body doesn\'t need, carbon dioxide.',
  bones:
    'Bones hold your body up, like the frame of a house, and protect the soft parts: your skull protects your brain, and your ribs protect your heart and lungs. Grown-ups have 206 bones.',
  teeth: 'Teeth bite and chew food so you can swallow it. Kids have 20 baby teeth, which fall out to make room for 32 grown-up teeth. The hard white outside is the hardest thing in your body.',
  muscles:
    'Muscles pull on your bones to move you, and you have more than 600 of them! You move some on purpose, like the ones in your arms and legs. Others work on their own, like your heart.',
  blood: 'Blood flows all around your body in tubes called blood vessels, pumped by your heart. It carries oxygen from your lungs and food from your tummy to every part of you.',
};

// --- Math shapes -----------------------------------------------------------------------------------

export const SHAPE_EXPLANATIONS: Record<string, string> = {
  cube: 'A cube has 6 faces, and every one is a square, all the same size. It has 12 edges and 8 corners, called vertices. Dice and sugar cubes are cubes.',
  sphere:
    'A sphere is perfectly round, like a ball. It has no flat faces, no edges and no corners, so it rolls in every direction. Balls, marbles and bubbles are spheres.',
  cylinder:
    'A cylinder has two flat circle faces, one at each end, joined by a curved side. It can roll on its side or stand up on an end. Cans are cylinders.',
  cone: 'A cone has one flat circle face and a curved side that comes to a point at the top. Ice cream cones, party hats and traffic cones are cones.',
  pyramid:
    'A pyramid has a flat base and triangle sides that meet at a point at the top. The famous pyramids in Egypt have a square base and four triangle sides: 5 faces in all.',
  'rectangular-prism':
    'A rectangular prism is shaped like a box: its 6 faces are all rectangles. It has 12 edges and 8 corners, just like a cube. Cereal boxes and bricks are rectangular prisms.',
  'triangular-prism':
    'A triangular prism has two triangle faces, one at each end, joined by three rectangles. That\'s 5 faces, 9 edges and 6 corners. A tent can be shaped like one.',
};

// --- The world -----------------------------------------------------------------------------------

export const FLAG_EXPLANATIONS: Record<string, string> = {
  japan:
    'Japan\'s flag is a red circle on white. The circle stands for the sun: Japan\'s name in Japanese, Nihon, means "origin of the sun". That\'s why it\'s called the Land of the Rising Sun.',
  france:
    'France\'s flag has three stripes going up and down: blue, white and red. It\'s called the Tricolore, which means "three colors", and it was first flown over 200 years ago.',
  italy: 'Italy\'s flag has three stripes going up and down: green, white and red. A pizza margherita has the same colors: green basil, white cheese and red tomato.',
  germany: 'Germany\'s flag has three stripes going across: black, red and gold. Stripes that go across are called horizontal stripes.',
  ireland:
    'Ireland\'s flag has green, white and orange stripes. Green stands for one group of people in Ireland and orange for another, with white in the middle for peace between them.',
  nigeria: 'Nigeria\'s flag has green, white and green stripes. The green stands for Nigeria\'s forests and farmland, and the white for peace.',
  ukraine: 'Ukraine\'s flag has two stripes: blue on top and yellow below, like a blue sky over golden fields of wheat.',
  sweden:
    'Sweden\'s flag is a yellow cross on blue. The cross sits off to one side. It\'s called a Nordic cross, and Denmark, Norway, Finland and Iceland have one on their flags too.',
  switzerland:
    'Switzerland\'s flag is a white cross on red, and it\'s square! Only one other country, Vatican City, has a square flag. The Red Cross symbol is the Swiss flag with its colors swapped.',
  greece:
    'Greece\'s flag has nine blue and white stripes and a white cross. The blue and white are said to stand for the sea and the sky, and the cross for the country\'s church.',
  'united-states':
    'The flag of the United States has 50 stars, one for each state, and 13 red and white stripes for the first 13 states. It\'s nicknamed the Stars and Stripes.',
  'united-kingdom':
    'The United Kingdom\'s flag, the Union Jack, is three crosses on top of each other: a red cross for England, a white X for Scotland and a red X for Ireland. Wales has its own flag with a red dragon.',
  canada: 'Canada\'s flag has a red maple leaf on white, between two red bands. Maple trees grow all over Canada, and maple syrup comes from their sap.',
  mexico:
    'Mexico\'s flag has green, white and red stripes, with an eagle in the middle perched on a cactus, eating a snake. It comes from an old Aztec story about where to build their city, which is now Mexico City.',
  brazil:
    'Brazil\'s flag has a yellow diamond on green, with a blue globe in the middle. On the real flag, the globe is full of stars, one for each of Brazil\'s states, and its white band says "Order and Progress" in Portuguese.',
  china: 'China\'s flag is red with five yellow stars. The big star stands for the Communist Party that leads China, and the four small stars for the Chinese people.',
  india: 'India\'s flag has saffron (orange), white and green stripes. In the middle is a navy blue wheel with 24 spokes, called the Ashoka Chakra.',
};

// --- Computers -----------------------------------------------------------------------------------

export const COMPUTER_PART_EXPLANATIONS: Record<string, string> = {
  computer:
    'A computer is a machine that follows instructions, called programs, to do all kinds of jobs: games, drawing, writing and video calls. A chip inside called the processor does the work, very fast.',
  laptop: 'A laptop is a computer small enough to carry around. The screen, keyboard, touchpad and battery are all built in, and it folds shut.',
  keyboard:
    'A keyboard is for typing letters, numbers and symbols into a computer. It\'s an input device. The letters aren\'t in ABC order: the layout is called QWERTY, after the first six letters on the top row.',
  mouse: 'A mouse moves the pointer on the screen, and its buttons click on things. It\'s an input device. It\'s called a mouse because early ones had a long cord, like a tail.',
  printer:
    'A printer puts what\'s on the computer onto paper. It\'s an output device. Special printers called 3D printers can even make objects out of plastic, one thin layer at a time.',
  phone: 'A smartphone is a computer that fits in your pocket, with a touchscreen, camera, microphone and speaker. It can make calls, send messages, take photos and run apps.',
  headphones: 'Headphones play sound right next to your ears, so only you can hear it. They\'re an output device: sound comes out of the computer to you.',
  microphone: 'A microphone turns sounds, like your voice, into signals a computer can record. It\'s an input device: sound goes into the computer.',
  camera: 'A camera takes pictures and videos. A digital camera turns light into millions of tiny colored dots, called pixels, which the computer saves. It\'s an input device.',
  battery:
    'A battery stores electricity, so a device can work without being plugged in. Rechargeable batteries, like the ones in phones and laptops, can be filled up again and again.',
  plug: 'A plug connects a device to the electricity in the wall, to power it or charge its battery. Electricity can be dangerous, so leave plugging and unplugging to grown-ups.',
  joystick: 'A joystick is a stick you tip in any direction to move things in a game, like a character or a plane. It\'s an input device, like a mouse or a keyboard.',
};

export const CODING_EXPLANATIONS: Record<string, string> = {
  algorithm:
    'An algorithm is a list of steps for doing something, in the right order, like a recipe. Brushing your teeth is an algorithm: wet the brush, add toothpaste, brush, rinse. Computers follow algorithms that people write.',
  sequence:
    'A sequence is steps done one after another, in order. The order matters: putting on your shoes before your socks doesn\'t work! A computer runs a program\'s steps in sequence, from the top down.',
  loop: 'A loop repeats steps again and again, so you don\'t have to write them out each time. "Clap 3 times" is a loop: clap, clap, clap. Some loops repeat a set number of times, and some keep going until something happens.',
  condition:
    'A condition is a question with a yes or no answer, used to decide what to do next. "If it\'s raining, take an umbrella" has a condition: is it raining? In code, conditions often start with the word if.',
  variable:
    'A variable is like a box with a label, holding a piece of information such as a score or a name. What\'s inside can change: when you win a point, the score variable goes up by 1.',
  event: 'An event is something that happens, like a tap, a click or a key press, that tells a program to do something. "When the space bar is pressed, jump" waits for an event.',
  input: 'Input is information that goes into a computer, from a keyboard, a mouse, a touchscreen, a microphone or a camera. The program uses it to decide what to do.',
  output: 'Output is what a computer gives back: pictures on the screen, sounds from the speaker, or pages from the printer. Input goes in, the computer works on it, and output comes out.',
  bug: 'A bug is a mistake in a program that makes it do something unexpected. Everybody\'s code has bugs sometimes! In 1947, computer scientists found a real moth stuck inside their computer, and taped it into their notebook.',
  debug: 'Debugging means finding and fixing bugs. Programmers test their code, look carefully at what went wrong, change something, and test again until it works.',
  program:
    'A program is a set of instructions written in a language a computer understands. Games, apps and websites are all programs. Writing programs is called coding or programming.',
  robot: 'A robot is a machine that follows a program to do jobs by itself. It uses sensors to notice what\'s around it, a computer to decide what to do, and motors to move.',
};
