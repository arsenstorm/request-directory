"use server";

import { createClient } from "@/utils/supabase/supa";

export async function updateFunds(
	userData: { funds: number; id: string },
	actual: number | null,
	estimated: number,
	type: "add" | "subtract" = "subtract",
) {
	const supabase = createClient();

	const precision = 10;

	const safeActual =
		actual !== null ? Number.parseFloat(actual.toFixed(precision)) : 0;
	const safeEstimated = Number.parseFloat(estimated.toFixed(precision));

	let amountToChange = safeEstimated;
	if (type === "add") {
		amountToChange = safeActual;
	} else if (safeActual !== null) {
		amountToChange = safeActual - safeEstimated;
	}

	const newAmount = Number.parseFloat(
		(type === "add"
			? userData.funds + amountToChange
			: userData.funds - amountToChange
		).toFixed(precision),
	);

	// update user funds
	const { data: updatedUserData, error: updateFundsError } = await supabase
		.from("users")
		.update({
			funds: newAmount,
		})
		.eq("id", userData.id)
		.select("funds");

	if (updateFundsError) {
		throw new Error("Failed to update user funds.");
	}

	return updatedUserData;
}
