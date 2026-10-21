"use client";

import { useState } from "react";

export default function LoginPage() {
	const [message, setMessage] = useState("");

	return (
		<main className="flex min-h-dvh items-center justify-center bg-white px-6 py-10">
			<section className="w-full max-w-[488px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
				<h1 className="mb-8 text-center text-h4 text-navy-900">Sign in</h1>

				<form
					className="space-y-6"
					onSubmit={(event) => {
						event.preventDefault();
						setMessage("Sign-in is not connected yet.");
					}}
				>
					<div>
						<label
							htmlFor="email"
							className="mb-2 block text-body2 text-navy-900"
						>
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							placeholder="Enter your email address"
							className="w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-2 block text-body2 text-navy-900"
						>
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							required
							placeholder="Enter your password"
							className="w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300"
						/>
						<div className="mt-2 text-right">
							<button
								type="button"
								onClick={() => setMessage("Password recovery is not available yet.")}
								className="text-body2 font-bold text-navy-800 hover:underline"
							>
								Forgot password?
							</button>
						</div>
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700"
					>
						Log In
					</button>
					<p aria-live="polite" className="min-h-5 text-center text-body2 text-red-700">
						{message}
					</p>
				</form>

				<p className="mt-1 text-center text-body2 text-navy-800">
					Need an account?{" "}
					<button
						type="button"
						onClick={() => setMessage("Account creation is not available yet.")}
						className="font-bold hover:underline"
					>
						Create an account
					</button>
				</p>
			</section>
		</main>
	);
}
