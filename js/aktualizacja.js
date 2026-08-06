async function pobierzDateOstatniejZmiany(repo, folder) {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${repo}/commits?path=${folder}&per_page=1`
		);
		const commits = await response.json();
		if (!commits.length) {
			throw new Error("Brak commitów");
		}
		return new Date(commits[0].commit.committer.date)
			.toLocaleDateString("pl-PL", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric"
			}) + " r.";
	} catch (err) {
		console.error(err);
		return "brak danych";
	}
}
