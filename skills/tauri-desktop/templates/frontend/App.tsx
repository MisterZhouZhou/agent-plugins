import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="navbar rounded-box bg-base-100 px-5 shadow-sm">
          <div className="flex-1">
            <span className="text-lg font-semibold">tauri-desktop-app</span>
          </div>
          <div className="badge badge-primary badge-outline">Tauri v2</div>
        </header>

        <section className="hero flex-1">
          <div className="hero-content grid w-full gap-8 px-0 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="badge badge-secondary mb-5">React + TypeScript</div>
              <h1 className="text-4xl font-bold tracking-normal md:text-5xl">
                Desktop app starter
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-base-content/70">
                A clean Tauri project with Tailwind CSS, DaisyUI, clsx, and
                build scripts ready for desktop development.
              </p>

              <div className="stats stats-vertical mt-8 w-full bg-base-100 shadow-sm sm:stats-horizontal">
                <div className="stat">
                  <div className="stat-title">UI</div>
                  <div className="stat-value text-primary">DaisyUI</div>
                  <div className="stat-desc">Theme-ready components</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Build</div>
                  <div className="stat-value text-secondary">Tauri</div>
                  <div className="stat-desc">Native app bundle</div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <form
                className="card-body gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  greet();
                }}
              >
                <div>
                  <h2 className="card-title">Rust command check</h2>
                  <p className="mt-1 text-sm text-base-content/60">
                    Call the bundled Tauri command from the React UI.
                  </p>
                </div>

                <label className="form-control w-full">
                  <span className="label">
                    <span className="label-text">Name</span>
                  </span>
                  <input
                    id="greet-input"
                    className="input input-bordered w-full"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name"
                  />
                </label>

                <div className="card-actions justify-end">
                  <button className="btn btn-primary" type="submit">
                    Greet
                  </button>
                </div>

                {greetMsg ? (
                  <div className="alert alert-success">
                    <span>{greetMsg}</span>
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
