import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

const creditsLogo = "/login-assets/credits-mark.png";
const cMonogram = "/login-assets/c-shape-blue.png";
const cdlSpcLogos = "/login-assets/partners-spc.png";
const cGlow = "/login-assets/c-shape-glow.png";
const chatGPTImage = "/attached-assets/credits-brand-primary.png";

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const didLogin = onLogin(username, password);

    if (!didLogin) {
      setError("Credenciais inválidas. Tente novamente.");

      return;
    }

    setError(null);
    setLocation("/verticais/credito-risco/spc-maxi");
  };

  return (
    <div className="flex h-[100dvh] w-full font-sans bg-[#F4F6FA] text-[#0A1F5C] selection:bg-[#F5821F] selection:text-white overflow-hidden">
      <motion.div
        className="hidden md:flex w-1/2 bg-[#0A1F5C] text-white flex-col relative overflow-hidden"
        initial={{ x: "-10%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
          <img
            src={cMonogram}
            alt=""
            className="h-[80vh] w-auto object-contain brightness-0 invert"
          />
        </div>

        <img
          src={cGlow}
          alt=""
          aria-hidden
          className="absolute bottom-0 right-0 w-[72%] opacity-20 pointer-events-none"
        />

        <div className="p-8 flex items-center gap-4">
          <img
            src={chatGPTImage}
            alt="CREDITS"
            style={{ height: "90px", width: "auto", objectFit: "contain" }}
          />

          <div className="w-[1px] h-8 bg-white/20"></div>

          <div className="text-[0.65rem] lg:text-xs font-semibold tracking-widest leading-tight text-white/80">
            INTELIGENCIA PARA NEGOCIOS
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 z-10 max-w-2xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="inline-block bg-[#F5821F]/10 text-[#F5821F] text-xs font-bold px-3 py-1.5 rounded-full tracking-wider mb-6 border border-[#F5821F]/20">
              PLATAFORMA EMPRESARIAL
            </div>

            <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] mb-6">
              Decisoes mais
              <br />
              seguras começam
              <br />
              aqui.
            </h1>

            <p className="text-white/70 text-lg lg:text-xl leading-relaxed max-w-md">
              Acesse as solucoes CREDITS para consultar informacoes, analisar
              riscos e proteger o crescimento da sua empresa.
            </p>
          </motion.div>
        </div>

        <div className="px-8 py-12 flex justify-between items-end z-10 text-[0.65rem] lg:text-xs font-semibold tracking-widest text-white/60">
          <div>AMBIENTE PROTEGIDO</div>

          <div className="text-right">CDL | SPC BRASIL</div>
        </div>
      </motion.div>

      <motion.div
        className="w-full md:w-1/2 flex flex-col relative bg-[#F4F6FA]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="z-10 px-6 md:px-8 pt-6 md:pt-8">
          <div className="mx-auto flex w-full max-w-[90%] items-center justify-between">
            <div className="md:hidden">
              <img
                src={creditsLogo}
                alt="CREDITS"
                style={{ height: "100px", width: "auto", objectFit: "contain" }}
              />
            </div>

            <div className="hidden md:block">
              <img
                src={creditsLogo}
                alt="CREDITS"
                style={{ height: "100px", width: "auto", objectFit: "contain" }}
                className="h-5 lg:h-6 object-contain"
              />
            </div>

            <img
              src={cMonogram}
              alt="C Icon"
              style={{ height: "35px", width: "auto", objectFit: "contain" }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 pb-16 pt-8 md:pb-20 md:pt-10 z-0">
          <div className="w-full max-w-[90%]">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F5821F]"></div>

                <span className="text-xs font-bold tracking-widest text-slate-500">
                  AREA RESTRITA
                </span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-[#0A1F5C]">
                Bem-vindo de volta
              </h2>

              <p className="text-slate-500">
                Entre com seus dados para acessar sua conta.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100"
            >
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="username"
                    className="text-sm font-semibold text-[#0A1F5C] block"
                  >
                    E-mail corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="username"
                      //   type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent transition-shadow"
                      placeholder="seuemail@empresa.com.br"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[#0A1F5C] block"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent transition-shadow"
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckboxPrimitive.Root
                      id="remember"
                      checked={keepConnected}
                      onCheckedChange={(checked) =>
                        setKeepConnected(checked === true)
                      }
                      className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white shadow-sm data-[state=checked]:bg-[#0A1F5C] data-[state=checked]:border-[#0A1F5C] transition-colors hover:border-[#0A1F5C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]"
                    >
                      <CheckboxPrimitive.Indicator className="text-white">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </CheckboxPrimitive.Indicator>
                    </CheckboxPrimitive.Root>
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                    >
                      Manter conectado
                    </label>
                  </div>
                  <a
                    href="#"
                    className="text-sm font-semibold text-[#0A1F5C] hover:text-[#F5821F] transition-colors"
                  >
                    Esqueci minha senha
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-[#F5821F] hover:bg-[#F5821F]/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-[#F5821F]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#F5821F]/30 active:translate-y-0 active:shadow-md flex items-center justify-center gap-2 group"
                >
                  Acessar plataforma
                  <span className="transform transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 text-center">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Seus dados sao tratados com seguranca e privacidade.
              </div>

              <img
                src={cdlSpcLogos}
                alt="CDL SPC BRASIL"
                className="w-[200px] max-w-full h-auto object-contain opacity-80 transition-all duration-300 hover:opacity-100 m-[-60px] p-0"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
