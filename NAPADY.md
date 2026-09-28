# Nápady k zamyšlení do budoucna

Body, které teď neděláme, ale stojí za to se k nim vrátit.

## Web SK Viktoria

- **Proběhlé akce na stránce Akce ztlumit a posunout dolů.** Teď se zobrazují všechny akce bez ohledu na datum (řazení: nadcházející vzestupně, pak proběhlé) a staré akce maže admin ručně. Do budoucna by šlo proběhlé akce automaticky ztlumit (nižší kontrast, štítek „proběhlo“) a na homepage v „Nejbližších akcích“ ukazovat jen nadcházející. Předpoklad: spolehlivé datum akce (dnes je datum jen text `date_label`, web ho parsuje; lepší by bylo vyplňovat `starts_at` v adminu přes výběr data).
