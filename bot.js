const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf("7717218797:AAEcsfDuDANsu4O-Mwm56KxLkJsCECsah4M");

bot.telegram.setMyCommands([{ command: "start", description: "Start" }]);

let who__are__you = [];
let auth__part = [];

const read__handle = (direction) => {
	try {
		const data = fs.readFileSync(direction, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading the file:", error);
		return [];
	}
};

const calculate__distance = (lat1, long1, lat2, long2) => {
	const R = 6371; // Yer radiusi (kilometrda)

	// Graduslarni radianlarga o'zgartirish
	const toRadians = (degree) => degree * (Math.PI / 180);
	const dLat = toRadians(lat2 - lat1); // Kengliklar farqi
	const dLon = toRadians(long2 - long1); // Uzunliklar farqi

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // Masofa kilometrda
};

const closest__driver = (p__lat, p__long, drivers) => {
	let closestDriver = null;
	let minDistance = Infinity;

	// Har bir haydovchi uchun masofani hisoblash
	drivers.forEach((driver) => {
		const distance = calculate__distance(
			p__lat,
			p__long,
			driver.lat,
			driver.long
		);

		// Eng yaqin haydovchini topish
		if (distance < minDistance) {
			minDistance = distance;
			closestDriver = driver;
		}
	});

	return closestDriver;
};

const formatted__phone = (phone) => {
	if (!phone.startsWith("+")) {
		return "+" + phone;
	}
	return phone;
};

bot.command("start", (ctx) => {
	const data = read__handle("./users.json");
	const exist = data.filter((i) => i.id === ctx.from.id);

	if (exist.length >= 1) {
		if (exist[0].user__status === "Haydovchi") {
			ctx.reply("Salom", Markup.keyboard([["Yo'lovchi qidirish 🔍"]]).resize());
		} else {
			ctx.reply("Salom", Markup.keyboard([["Taksi chaqirish 🚕"]]).resize());
		}
	} else {
		ctx.reply(
			"Salom. Avval botdan ro'yxatdan o'ting",
			Markup.keyboard([["Ro'yxatdan o'tish 📋"]])
				.resize()
				.oneTime()
		);
	}
});

bot.on("message", (ctx) => {
	const data = read__handle("./users.json");
	const exist = data.filter((i) => i.id === ctx.from.id);

	if (ctx.message.text === "Ro'yxatdan o'tish 📋") {
		ctx.reply(
			"Qaysi turdagi xizmatimizdan foydalanmoqchisiz?",
			Markup.keyboard([
				["Men haydovchiman 👨‍✈️"],
				["Men taksi chaqirmoqchiman 🚖"],
			])
				.resize()
				.oneTime()
		);
		auth__part = ["phone"];
	} else if (ctx.message.text === "Men haydovchiman 👨‍✈️") {
		const auth = auth__part[0];

		if (auth !== "phone") {
			return;
		} else {
			ctx.reply(
				"Telefon raqamingizni ulashing",
				Markup.keyboard([
					Markup.button.contactRequest("Telefon raqamni ulashish 📲"),
				])
					.resize()
					.oneTime()
			);
			who__are__you = ["Haydovchi"];
		}
	} else if (ctx.message.text === "Men taksi chaqirmoqchiman 🚖") {
		const auth = auth__part[0];

		if (auth !== "phone") {
			return;
		} else {
			ctx.reply(
				"Telefon raqamingizni ulashing",
				Markup.keyboard([
					Markup.button.contactRequest("Telefon raqamni ulashish 📲"),
				])
					.resize()
					.oneTime()
			);
			who__are__you = ["Yo'lovchi"];
		}
	} else if (ctx.message.contact) {
		const phone__number = ctx.message.contact.phone_number;
		const who = who__are__you[0];
		const reading__data = read__handle("./users.json");
		const data = [
			...reading__data,
			{
				id: ctx.from.id,
				phone: phone__number,
				username: ctx.from.first_name,
				user__status: who,
			},
		];

		fs.promises.writeFile("./users.json", JSON.stringify(data, null, 2));
		if (who === "Yo'lovchi") {
			ctx.reply(
				"Siz muvaffaqiyatli ro'yxatdan o'tdingiz!",
				Markup.keyboard([["Taksi chaqirish 🚕"]]).resize()
			);
		} else if (who === "Haydovchi") {
			ctx.reply(
				"Siz muvaffaqiyatli ro'yxatdan o'tdingiz!",
				Markup.keyboard([["Yo'lovchi qidirish 🔍"]]).resize()
			);
		}
	} else if (exist.length < 1) {
		ctx.reply(
			"Salom. Avval botdan ro'yxatdan o'ting",
			Markup.keyboard([["Ro'yxatdan o'tish 📋"]])
				.resize()
				.oneTime()
		);
	} else {
		if (ctx.message.text === "Taksi chaqirish 🚕") {
			ctx.reply(
				"Joylashuvingizni ulashing. Sizga yaqin joylashgan haydovchini topib beramiz",
				Markup.keyboard([
					[Markup.button.locationRequest("Joylashuvni ulashish 📍")],
				])
					.resize()
					.oneTime()
			);
		} else if (ctx.message.text === "Yo'lovchi qidirish 🔍") {
			ctx.reply(
				"Joylashuvingizni ulashing. Sizga yaqin joylashgan yo'lovchini topib beramiz",
				Markup.keyboard([
					[Markup.button.locationRequest("Joylashuvni ulashish 📍")],
				])
					.resize()
					.oneTime()
			);
		} else if (ctx.message.location) {
			const { latitude, longitude } = ctx.message.location;
			const reading__data = read__handle("./users.json");
			const exist = reading__data.filter((i) => i.id === ctx.from.id);
			const data = [
				{
					id: ctx.from.id,
					phone: exist[0].phone,
					lat: latitude,
					long: longitude,
				},
			];

			if (exist[0].user__status === "Haydovchi") {
				ctx.reply(
					"Online qoling biz sizga tez orada xabar beramiz", 
					Markup.keyboard([
						[Markup.button.locationRequest("Joylashuvni ulashish 📍")],
					])
						.resize()
						.oneTime()
				);
				fs.promises.writeFile(
					"./driver__loc.json",
					JSON.stringify(data, null, 2)
				);
			} else {
				const reading__driver = read__handle("./driver__loc.json");
				const exist__driver = closest__driver(
					latitude,
					longitude,
					reading__driver
				);
				const f__phone = formatted__phone(exist[0].phone);
				const f__phone__driver = formatted__phone(exist__driver.phone);
				const rest__data = reading__driver.filter(
					(i) => i.id !== exist__driver.id
				);

				if (exist.length < 1) {
					return ctx.reply("Foydalanuvchi topilmadi!");
				}

				bot.telegram.sendMessage(
					exist__driver.id,
					`Yo'lovchi topildi\nIsm: ${exist[0].username}\nTel: ${f__phone}`
				);

				ctx.reply(
					`Haydovchi siz bilan tez orada bog'lanadi\nHaydovchiga telefon qilish: ${f__phone__driver}`
				);

				setTimeout(() => {
					if (rest__data.length < 1) {
						fs.promises.writeFile(
							"./driver__loc.json",
							JSON.stringify([], null, 2)
						);
					} else {
						fs.promises.writeFile(
							"./driver__loc.json",
							JSON.stringify(rest__data, null, 2)
						);
					}
				}, 500);
			}
		}
	}
});

bot.launch();
