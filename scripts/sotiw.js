function itemUuid(pf2e, sf2e) {
    return game.system.id === "sf2e" ? sf2e : pf2e
}

function getPack(pf2e, sf2e) {
    return game.packs.get(game.system.id === "sf2e" ? sf2e : pf2e)
}

Hooks.once("ready", async () => {
    if (!game.modules.get("pf2e-dailies")?.active) return;

    //Get the compendium of subclasses
    const pack = getPack("pf2e-soldiers-of-the-immortal-war.subclasses", "pf2e-soldiers-of-the-immortal-war.sf2e-subclasses");
    if(!pack) return;

    //Get and filter for blessings
    const index = await pack.getIndex({
        fields: ["system.traits.otherTags"]
    });
    
    const blessings = index.filter((entry) => 
        entry.system.traits.otherTags?.includes("blessing-of-the-devoted")
    );

    const updatedSettings = foundry.utils.deepClone(
        game.settings.get("pf2e-dailies", "homebrewEntries")
    );

    //Make sure blessing options exist!
    updatedSettings.blessings ??= [];

    //Loop throughg blessings, mark changed
    for(const blessing of blessings){
        if(!updatedSettings.blessings.includes(blessing.uuid)){
            updatedSettings.blessings.push(blessing.uuid);
        }
    }

    //save changes
    await game.settings.set(
        "pf2e-dailies",
        "homebrewEntries",
        updatedSettings
    );
})

Hooks.on("init", () => {
    if (!game.modules.get("pf2e-dailies")) return;
    const utils = game.dailies?.api?.utils;

    const herosArsenal = {
        key: "sotiw-heros-arsenal",
            items: [
                {
                    slug: "herosArsenal",
                    uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.abilities.Item.VqtyY4ujs9SG0pQI",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-abilities.Item.VqtyY4ujs9SG0pQI"),
                    required: true
                }
            ],
            label: (_actor, items) => items.herosArsenal.name,
            rows: async (actor, items) => {
                const pack = getPack("pf2e.classfeatures", "pf2e-anachronism.class-features");
                if(!pack) return;

                //get the default blessings
                const index = await pack.getIndex({
                    fields: ["system.traits.otherTags"]
                });

                const blessings = index.filter((entry) => 
                    entry.system.traits.otherTags?.includes("blessing-of-the-devoted")
                ) || [];

                //create options list
                const options = blessings.map(({name, uuid}) => ({value: uuid, label: name}));

                const hbEntries = game.settings.get("pf2e-dailies", "homebrewEntries").blessings;
                
                //add any blessings from homebrew
                for(const e of hbEntries) {
                    const entry = await fromUuid(e);
                    options.push({
                        value: entry.uuid,
                        label: entry.name,
                    });
                }

                //Sort alphabetically for niceness :)
                options.sort((a, b) => a.label.localeCompare(b.label));

                return [
                    {
                        type: "select",
                        slug: "heroBlessing",
                        label: "Hero's Arsenal",
                        options: options,
                    },
                ];
            },
            process: async ({actor, rows, messages, items, addFeat}) => {
                const source = await utils.createFeatSource(rows.heroBlessing);
                addFeat(source, items.herosArsenal);
                messages.add("Blessing of the Devoted:", { uuid: rows.heroBlessing});
            }
    }

    const blessedScripture = {
        key: "sotiw-blessed-scripture",
        items: [
            {
                slug: "blessing",
                uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.subclasses.Item.lRppcm0qVYT1gMtq",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-subclasses.Item.lRppcm0qVYT1gMtq"),
                required: true
            },
            {
                slug: "basicTranscription",
                uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.feats.Item.L4jA8JI9OFzodEZE",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-feats.Item.L4jA8JI9OFzodEZE"),
            },
            {
                slug: "greaterTranscription",
                uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.feats.Item.UNgHzi5DrKGUAZqP",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-feats.Item.UNgHzi5DrKGUAZqP"),
            },
            {
                slug: "grandTranscription",
                uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.feats.Item.fPIaZ41qQFYMPnj0",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-feats.Item.fPIaZ41qQFYMPnj0"),
            },
            {
                slug: "extensiveTranscription",
                uuid: itemUuid(
                        "Compendium.pf2e-soldiers-of-the-immortal-war.feats.Item.PDP7xXXZ97asGGaL",
                        "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-feats.Item.PDP7xXXZ97asGGaL"),
            },
        ],
        label: (_actor, items) => items.blessing.name,
        rows: (actor, items) => {
            const level = actor.level;
            const ranks = [1];

            if (items.basicTranscription) {
                ranks.push(2);
                if(level >= 8) ranks.push(3);
                if(level >= 10) ranks.push(4);
            }

            if (items.greaterTranscription) {
                ranks.push(5);
                if(level >= 14) ranks.push(6);
                if(level >= 16) ranks.push(7);
            }

            if (items.grandTranscription) {
                ranks.push(8);
                if(level >= 20) ranks.push(9);
            }

            if(items.extensiveTranscription){
                if(items.basicTranscription && level >= 8) ranks.push(11);
                if(items.basicTranscription && level >= 10) ranks.push(12);
                if(items.greaterTranscription) ranks.push(13);
                if(items.greaterTranscription && level >= 14) ranks.push(14);
                if(items.greaterTranscription && level >= 16) ranks.push(15);
                if(items.grandTranscription) ranks.push(16);
                if(items.grandTranscription && level >= 20) ranks.push(17);
            }

            return ranks.map(
                (rank) => ({
                    type: "drop",
                    slug: `${rank}`,
                    label: utils.getSpellRankLabel(rank > 9 ? rank - 10 : rank),
                    filter: {
                        type: "spell",
                        search: {
                            category: ["spell"],
                            rank: rank > 9 ? rank - 10 : rank,
                            rarity: ["common"]
                        }
                    }
                })
            );
        },
        process: async ({rows, messages, addItem}) => {
            for(const rank of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17]) {
                const {uuid} = rows[`${rank}`] ?? {};
                if (!uuid) continue;
                
                const label = utils.getSpellWithRankLabel(uuid, rank > 9 ? rank - 10 : rank);
                const source = await utils.createSpellScrollSource({
                    uuid,
                    level: rank > 9 ? rank - 10 : rank
                });

                addItem(source);
                messages.add("scrolls", {uuid, label});
            }
        }
    }

    const legacyOfBattle = {
        key: "sotiw-legacy-of-battle",
        items: [
            {
                slug: "lob",
                uuid: itemUuid(
                    "Compendium.pf2e-soldiers-of-the-immortal-war.feats.Item.FZWHwf3cG6i2oFIT",
                    "Compendium.pf2e-soldiers-of-the-immortal-war.sf2e-feats.Item.FZWHwf3cG6i2oFIT"
                ),
                required: true
            }
        ],
        label: (_actor, items) => items.lob.name,
        rows: (_actor, items) => {
            return [
                {
                    type: "drop",
                    slug: "lob",
                    label: `PF2E.Level6`,
                    filter: {
                        type: "feat",
                        search: {
                            category: ["class"],
                            traits: ["fighter"],
                            level: 6,
                        }
                    }
                }
            ]
        },
        process: async ({items, rows, messages, addFeat}) => {
            const source = await utils.createFeatSource(rows.lob.uuid);
            addFeat(source, items.lob);
            messages.add("feats", { uuid: rows.lob.uuid});
        }
    }

    game.dailies?.api.registerCustomDailies([blessedScripture, herosArsenal, legacyOfBattle]);
})